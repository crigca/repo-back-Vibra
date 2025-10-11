/**
 * Script de generación de imágenes por género
 *
 * Genera imágenes asociadas a géneros musicales (no a canciones específicas)
 * Las imágenes se pueden reutilizar para cualquier canción del mismo género
 *
 * Uso:
 *   node scripts/generate-by-genre.js Gospel 5        # Genera 5 imágenes de Gospel
 *   node scripts/generate-by-genre.js Rock 10         # Genera 10 imágenes de Rock
 *   node scripts/generate-by-genre.js all 2           # Genera 2 imágenes por cada género
 */

const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuración
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Argumentos
const genreArg = process.argv[2];
const countArg = parseInt(process.argv[3]) || 1;

if (!genreArg) {
  console.error('\n❌ Error: Debes especificar un género\n');
  console.log('Uso:');
  console.log('  node scripts/generate-by-genre.js Gospel 5');
  console.log('  node scripts/generate-by-genre.js Rock 10');
  console.log('  node scripts/generate-by-genre.js all 2\n');
  process.exit(1);
}

// Schema de GeneratedImage
const generatedImageSchema = new mongoose.Schema(
  {
    songId: { type: String, required: false, index: true },
    genre: { type: String, required: true, index: true },
    imageUrl: { type: String, required: true },
    thumbnailUrl: String,
    cloudinaryPublicId: String,
    cloudinaryFolder: String,
    prompt: { type: String, required: true },
    generator: { type: String, required: true },
    metadata: { type: Object, default: {} },
    processingTime: Number,
    isActive: { type: Boolean, default: true },
    userFavorites: { type: [String], default: [] },
  },
  { timestamps: true, collection: 'generatedImages' }
);

const GeneratedImage = mongoose.model('GeneratedImage', generatedImageSchema);

// Schema de Prompt
const promptSchema = new mongoose.Schema(
  {
    genre: { type: String, required: true },
    promptText: { type: String, required: true },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'prompts' }
);

const Prompt = mongoose.model('Prompt', promptSchema);

// Cargar prompts desde JSON
const promptsPath = path.join(__dirname, 'prompts.json');
const PROMPTS_DATA = JSON.parse(fs.readFileSync(promptsPath, 'utf-8'));

/**
 * Construye un prompt completo desde la estructura JSON
 */
function buildPromptText(genre) {
  const promptData = PROMPTS_DATA[genre];

  if (!promptData) {
    throw new Error(`No hay prompt disponible para el género: ${genre}`);
  }

  // Construir prompt combinando las 3 secciones
  const sceneText = promptData.sceneElements.join(', ');
  const styleText = promptData.visualStyle.join(', ');
  const moodText = promptData.emotionMood.join(', ');

  return `${sceneText}. Visual style: ${styleText}. Mood: ${moodText}.`;
}

/**
 * Obtiene un prompt para un género
 */
async function getRandomPrompt(genre) {
  try {
    const promptText = buildPromptText(genre);

    // Crear objeto similar al que retorna MongoDB
    return {
      _id: new mongoose.Types.ObjectId(),
      genre,
      promptText,
      category: 'base',
      isActive: true,
    };
  } catch (error) {
    throw new Error(`Error al obtener prompt para ${genre}: ${error.message}`);
  }
}

/**
 * Genera imagen con DALL-E
 */
async function generateWithDallE(promptText, genre) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no está configurada en .env');
  }

  const startTime = Date.now();

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: promptText,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        timeout: 120000,
      }
    );

    const imageUrl = response.data.data[0].url;
    const processingTime = Date.now() - startTime;

    return {
      imageUrl,
      processingTime,
      revisedPrompt: response.data.data[0].revised_prompt,
    };
  } catch (error) {
    if (error.response) {
      throw new Error(
        `DALL-E API error ${error.response.status}: ${JSON.stringify(error.response.data)}`
      );
    }
    throw error;
  }
}

/**
 * Sube imagen a Cloudinary
 */
async function uploadToCloudinary(imageUrl, genre) {
  const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
  const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials no están configuradas en .env');
  }

  try {
    const folder = `vibra/ai-generated/${genre}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Generar signature (solo con folder y timestamp)
    const crypto = require('crypto');
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const formData = new URLSearchParams();
    formData.append('file', imageUrl);
    formData.append('folder', folder);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return {
      imageUrl: response.data.secure_url,
      thumbnailUrl: response.data.secure_url.replace('/upload/', '/upload/w_400,h_400,c_fill/'),
      publicId: response.data.public_id,
    };
  } catch (error) {
    if (error.response) {
      throw new Error(
        `Cloudinary error ${error.response.status}: ${JSON.stringify(error.response.data)}`
      );
    }
    throw error;
  }
}

/**
 * Genera una imagen para un género
 */
async function generateImageForGenre(genre) {
  try {
    // 1. Obtener prompt
    const prompt = await getRandomPrompt(genre);
    console.log(`   📝 Prompt: ${prompt.promptText.substring(0, 60)}...`);

    // 2. Generar con DALL-E
    console.log(`   🎨 Generando con DALL-E...`);
    const dalleResult = await generateWithDallE(prompt.promptText, genre);
    const duration = (dalleResult.processingTime / 1000).toFixed(1);
    console.log(`   ✅ DALL-E completado en ${duration}s`);

    // 3. Subir a Cloudinary
    console.log(`   ☁️  Subiendo a Cloudinary...`);
    const cloudinaryResult = await uploadToCloudinary(dalleResult.imageUrl, genre);
    console.log(`   ✅ Subido a Cloudinary`);

    // 4. Guardar en MongoDB
    const generatedImage = new GeneratedImage({
      genre,
      imageUrl: cloudinaryResult.imageUrl,
      thumbnailUrl: cloudinaryResult.thumbnailUrl,
      cloudinaryPublicId: cloudinaryResult.publicId,
      cloudinaryFolder: `vibra/ai-generated/${genre}`,
      prompt: prompt.promptText,
      generator: 'PrimaryAIGenerator',
      metadata: {
        aiModel: 'dall-e-3',
        revisedPrompt: dalleResult.revisedPrompt,
        promptId: prompt._id.toString(),
        promptCategory: prompt.category,
      },
      processingTime: dalleResult.processingTime,
      isActive: true,
    });

    await generatedImage.save();
    console.log(`   ✅ Guardado en MongoDB: ${generatedImage._id}`);

    return {
      success: true,
      imageId: generatedImage._id,
      imageUrl: cloudinaryResult.imageUrl,
      processingTime: dalleResult.processingTime,
    };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Main
 */
async function main() {
  console.log('🎨 Generación de imágenes por género\n');

  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Determinar géneros a procesar
    let genresToProcess = [];

    if (genreArg.toLowerCase() === 'all') {
      // Cargar todos los géneros desde genres.json
      const genresPath = path.join(__dirname, 'genres.json');
      const allGenres = JSON.parse(fs.readFileSync(genresPath, 'utf-8'));
      genresToProcess = allGenres;
      console.log(`📋 Generando ${countArg} imagen(es) para cada uno de los ${allGenres.length} géneros\n`);
    } else {
      genresToProcess = [genreArg];
      console.log(`📋 Generando ${countArg} imagen(es) para el género: ${genreArg}\n`);
    }

    // Generar imágenes
    let totalSuccess = 0;
    let totalFail = 0;
    const startTime = Date.now();

    for (const genre of genresToProcess) {
      console.log(`\n🎵 Género: ${genre}`);

      for (let i = 0; i < countArg; i++) {
        console.log(`\n[${i + 1}/${countArg}]`);
        const result = await generateImageForGenre(genre);

        if (result.success) {
          totalSuccess++;
        } else {
          totalFail++;
        }

        // Pausa entre requests (evitar rate limit)
        if (i < countArg - 1 || genresToProcess.indexOf(genre) < genresToProcess.length - 1) {
          console.log(`   ⏳ Esperando 3 segundos...`);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    // Resumen
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN:');
    console.log(`   ✅ Exitosas: ${totalSuccess}`);
    console.log(`   ❌ Fallidas: ${totalFail}`);
    console.log(`   ⏱️  Tiempo total: ${totalTime} minutos`);
    console.log(`   💰 Costo estimado: $${(totalSuccess * 0.04).toFixed(2)} USD`);
    console.log('='.repeat(70));

    await mongoose.disconnect();
    console.log('\n✅ Script completado\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
