/**
 * SCRIPT DE GENERACIÓN MASIVA DE IMÁGENES
 *
 * Objetivo: Usar todos los créditos de Replicate (~$2.43)
 *
 * Plan:
 * 1. Completar todos los géneros a mínimo 50 imágenes
 * 2. Con lo que sobre, generar más para los 20 géneros más populares
 */

const mongoose = require('mongoose');
const axios = require('axios');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

// ================================
// CONFIGURACIÓN
// ================================
const TARGET_MIN_IMAGES = 50;  // Mínimo de imágenes por género
const COST_PER_IMAGE = 0.002;  // Costo por imagen en Replicate
const TOTAL_BUDGET = 2.43;     // Presupuesto total
const MAX_IMAGES = Math.floor(TOTAL_BUDGET / COST_PER_IMAGE); // ~1215 imágenes
const DELAY_BETWEEN_REQUESTS = 3000; // 3 segundos entre requests para evitar rate limit

// Top 20 géneros para priorizar con el sobrante
const TOP_GENRES = [
  'rockArgentino', 'heavyMetal', 'popLatinoActual', 'rock', 'pop',
  'cumbia', 'cuarteto', 'rockLatino', 'cumbiaVillera', 'reggaeton',
  'trap', 'cumbia420', 'reggae', 'house', 'bachata',
  'folkloreArgentino', 'edmActual', 'balada', 'popLatinoClasico', 'techno'
];

// Replicate config
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
const REPLICATE_MODEL_VERSION = '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MongoDB schemas
const generatedImageSchema = new mongoose.Schema({
  songId: String,
  genre: { type: String, index: true },
  imageUrl: { type: String, required: true },
  thumbnailUrl: String,
  cloudinaryPublicId: String,
  cloudinaryFolder: String,
  prompt: { type: String, required: true },
  generator: { type: String, required: true },
  metadata: { type: Object, default: {} },
  processingTime: Number,
  isActive: { type: Boolean, default: true },
  userFavorites: [String],
}, { timestamps: true, collection: 'generatedImages' });

const promptSchema = new mongoose.Schema({
  genre: String,
  promptText: String,
  category: String,
  isActive: { type: Boolean, default: true },
}, { collection: 'prompts' });

let GeneratedImage;
let Prompt;

// ================================
// ESTADÍSTICAS
// ================================
const stats = {
  totalGenerated: 0,
  totalFailed: 0,
  totalCost: 0,
  byGenre: {},
  startTime: null,
  endTime: null,
};

// ================================
// FUNCIONES AUXILIARES
// ================================

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Limpia el prompt de palabras que pueden ser flaggeadas como NSFW
 */
function cleanPromptText(prompt) {
  return prompt
    .replace(/sensual|sexy|erotic|nude|naked|adult|seductive/gi, 'artistic')
    .replace(/passionate|intimate|romantic couple/gi, 'emotional')
    .replace(/body|bodies|flesh/gi, 'forms')
    .replace(/dancing couples/gi, 'dancing silhouettes')
    .replace(/tender|hot|steamy/gi, 'warm');
}

async function getRandomPromptByGenre(genre) {
  const prompts = await Prompt.find({ genre, isActive: true });
  if (prompts.length === 0) {
    // Prompt genérico
    return {
      promptText: `Abstract artistic visualization representing ${genre} music. Vibrant colors, dynamic composition, and modern aesthetics that capture the essence and energy of the genre. High quality, artistic, professional digital art.`,
      category: 'base'
    };
  }
  return prompts[Math.floor(Math.random() * prompts.length)];
}

async function generateWithReplicate(prompt, retryCount = 0) {
  const MAX_RETRIES = 3;
  const cleanPrompt = cleanPromptText(prompt);

  try {
    // 1. Crear predicción
    const createResponse = await axios.post(
      REPLICATE_API_URL,
      {
        version: REPLICATE_MODEL_VERSION,
        input: {
          prompt: cleanPrompt,
          width: 1024,
          height: 1024,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          scheduler: 'K_EULER',
          num_outputs: 1,
        },
      },
      {
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const predictionId = createResponse.data.id;

    // 2. Polling hasta completar
    const maxAttempts = 60;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await delay(2000);

      const pollResponse = await axios.get(
        `${REPLICATE_API_URL}/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          },
          timeout: 10000,
        }
      );

      const { status, output, error } = pollResponse.data;

      if (status === 'succeeded' && output && output.length > 0) {
        return output[0];
      }

      if (status === 'failed') {
        throw new Error(`Replicate failed: ${error || 'Unknown error'}`);
      }

      if (status === 'canceled') {
        throw new Error('Prediction was canceled');
      }
    }

    throw new Error('Timeout waiting for Replicate');

  } catch (error) {
    // Retry en caso de rate limit (429)
    if (error.response && error.response.status === 429 && retryCount < MAX_RETRIES) {
      const waitTime = (retryCount + 1) * 5000; // 5s, 10s, 15s
      console.log(`\n   ⏳ Rate limit, esperando ${waitTime / 1000}s...`);
      await delay(waitTime);
      return generateWithReplicate(prompt, retryCount + 1);
    }

    throw error;
  }
}

async function uploadToCloudinary(imageUrl, genre) {
  // Descargar imagen
  const response = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 30000,
  });

  const buffer = Buffer.from(response.data);

  // Subir a Cloudinary
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `vibra/ai-generated/${genre}`,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

async function generateAndSaveImage(genre) {
  const startTime = Date.now();

  try {
    // 1. Obtener prompt
    const prompt = await getRandomPromptByGenre(genre);

    // 2. Generar con Replicate
    const imageUrl = await generateWithReplicate(prompt.promptText);

    // 3. Subir a Cloudinary
    const cloudinaryResult = await uploadToCloudinary(imageUrl, genre);

    // 4. Guardar en MongoDB
    const processingTime = Date.now() - startTime;

    const newImage = new GeneratedImage({
      genre,
      imageUrl: cloudinaryResult.secure_url,
      thumbnailUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      cloudinaryFolder: `vibra/ai-generated/${genre}`,
      prompt: prompt.promptText,
      generator: 'Replicate-SDXL-MassGen',
      processingTime,
      metadata: {
        aiModel: 'Replicate SDXL',
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        promptCategory: prompt.category || 'base',
        batchGenerated: true,
      },
      isActive: true,
    });

    await newImage.save();

    return { success: true, processingTime };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ================================
// FUNCIÓN PRINCIPAL
// ================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('        GENERACIÓN MASIVA DE IMÁGENES CON REPLICATE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\n💰 Presupuesto: $${TOTAL_BUDGET}`);
  console.log(`📊 Máximo de imágenes: ${MAX_IMAGES}`);
  console.log(`🎯 Objetivo mínimo por género: ${TARGET_MIN_IMAGES}`);
  console.log(`⏱️  Delay entre requests: ${DELAY_BETWEEN_REQUESTS / 1000}s\n`);

  // Verificar configuración
  if (!REPLICATE_API_TOKEN) {
    console.error('❌ REPLICATE_API_TOKEN no configurado');
    process.exit(1);
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('❌ Cloudinary no configurado');
    process.exit(1);
  }

  // Conectar a MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    GeneratedImage = mongoose.model('GeneratedImage', generatedImageSchema);
    Prompt = mongoose.model('Prompt', promptSchema);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }

  stats.startTime = Date.now();

  // ================================
  // FASE 1: Análisis
  // ================================
  console.log('📊 FASE 1: Analizando géneros...\n');

  const allGenres = require('../../data/genres.json');
  const genreStats = [];

  for (const genre of allGenres) {
    const count = await GeneratedImage.countDocuments({ genre, isActive: true });
    const needed = Math.max(0, TARGET_MIN_IMAGES - count);
    genreStats.push({ genre, current: count, needed });
  }

  // Ordenar por los que más necesitan
  genreStats.sort((a, b) => b.needed - a.needed);

  const totalNeededForMin = genreStats.reduce((sum, g) => sum + g.needed, 0);
  console.log(`📋 Total imágenes necesarias para mínimo ${TARGET_MIN_IMAGES}: ${totalNeededForMin}`);

  // ================================
  // FASE 2: Plan de generación
  // ================================
  console.log('\n📋 FASE 2: Planificando generación...\n');

  const generationPlan = [];
  let imagesPlanned = 0;

  // Primero: completar géneros a 50
  for (const g of genreStats) {
    if (g.needed > 0 && imagesPlanned < MAX_IMAGES) {
      const toGenerate = Math.min(g.needed, MAX_IMAGES - imagesPlanned);
      generationPlan.push({ genre: g.genre, count: toGenerate, phase: 'complete' });
      imagesPlanned += toGenerate;
    }
  }

  // Segundo: agregar más a los top 20 con lo que sobre
  const remaining = MAX_IMAGES - imagesPlanned;
  if (remaining > 0) {
    const extraPerGenre = Math.floor(remaining / TOP_GENRES.length);
    for (const genre of TOP_GENRES) {
      if (extraPerGenre > 0) {
        generationPlan.push({ genre, count: extraPerGenre, phase: 'extra' });
        imagesPlanned += extraPerGenre;
      }
    }
  }

  console.log(`📊 Plan de generación:`);
  console.log(`   - Imágenes para completar a ${TARGET_MIN_IMAGES}: ${totalNeededForMin}`);
  console.log(`   - Imágenes extra para top géneros: ${imagesPlanned - Math.min(totalNeededForMin, MAX_IMAGES)}`);
  console.log(`   - Total planificado: ${imagesPlanned}`);
  console.log(`   - Costo estimado: $${(imagesPlanned * COST_PER_IMAGE).toFixed(2)}\n`);

  // Mostrar primeros géneros
  console.log('🎯 Primeros géneros a procesar:');
  generationPlan.slice(0, 10).forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.genre}: ${p.count} imágenes (${p.phase})`);
  });
  console.log('');

  // ================================
  // FASE 3: Generación
  // ================================
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 FASE 3: Iniciando generación...');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('⏳ Esperando 5 segundos antes de comenzar...\n');
  await delay(5000);

  let totalGenerated = 0;
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 10; // Aumentado a 10

  for (const plan of generationPlan) {
    console.log(`\n📁 Género: ${plan.genre} (${plan.count} imágenes, ${plan.phase})`);
    console.log('─'.repeat(50));

    stats.byGenre[plan.genre] = { success: 0, failed: 0 };

    for (let i = 0; i < plan.count; i++) {
      // Verificar si ya alcanzamos el máximo
      if (totalGenerated >= MAX_IMAGES) {
        console.log('\n⚠️  Límite de presupuesto alcanzado!');
        break;
      }

      // Verificar errores consecutivos
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.log('\n❌ Demasiados errores consecutivos. Posiblemente sin créditos.');
        break;
      }

      process.stdout.write(`   [${i + 1}/${plan.count}] Generando... `);

      const result = await generateAndSaveImage(plan.genre);

      if (result.success) {
        totalGenerated++;
        stats.totalGenerated++;
        stats.totalCost += COST_PER_IMAGE;
        stats.byGenre[plan.genre].success++;
        consecutiveErrors = 0;

        console.log(`✅ (${(result.processingTime / 1000).toFixed(1)}s) | Total: ${totalGenerated}/${MAX_IMAGES} | $${stats.totalCost.toFixed(2)}`);
      } else {
        stats.totalFailed++;
        stats.byGenre[plan.genre].failed++;
        consecutiveErrors++;

        console.log(`❌ ${result.error}`);
      }

      // Pausa entre generaciones para evitar rate limit
      await delay(DELAY_BETWEEN_REQUESTS);
    }

    if (totalGenerated >= MAX_IMAGES || consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      break;
    }
  }

  // ================================
  // RESUMEN FINAL
  // ================================
  stats.endTime = Date.now();
  const duration = (stats.endTime - stats.startTime) / 1000 / 60;

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                      RESUMEN FINAL');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`⏱️  Duración total: ${duration.toFixed(1)} minutos`);
  console.log(`✅ Imágenes generadas: ${stats.totalGenerated}`);
  console.log(`❌ Fallos: ${stats.totalFailed}`);
  console.log(`💰 Costo total: $${stats.totalCost.toFixed(2)}`);
  console.log(`💵 Créditos restantes: $${(TOTAL_BUDGET - stats.totalCost).toFixed(2)}`);

  console.log('\n📊 Por género:');
  Object.entries(stats.byGenre)
    .filter(([_, v]) => v.success > 0)
    .sort((a, b) => b[1].success - a[1].success)
    .slice(0, 15)
    .forEach(([genre, data]) => {
      console.log(`   ${genre}: ${data.success} ✅ ${data.failed > 0 ? `${data.failed} ❌` : ''}`);
    });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    ¡GENERACIÓN COMPLETADA!');
  console.log('═══════════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
}

// Ejecutar
main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
