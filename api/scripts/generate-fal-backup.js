/**
 * Script de generación de imágenes con FAL AI (Flux Schnell)
 *
 * Genera 100 imágenes aleatorias distribuidas por tiers:
 * - Tier 1: 50 imágenes
 * - Tier 2: 30 imágenes
 * - Tier 3: 10 imágenes
 * - Tier 4: 10 imágenes
 *
 * Los géneros se seleccionan aleatoriamente de cada tier
 */

const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ===================================================================
// 📊 CONFIGURACIÓN
// ===================================================================
const IMAGES_PER_TIER = {
  tier1: 40,
  tier2: 30,
  tier3: 15,
  tier4: 15,
};

const TIERS_CONFIG = require('./genres-tiers.json');
const PROMPTS_DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'prompts.json'), 'utf-8'));
const GENRE_FAMILIES = require('./genre-families.json');

// Estilos artísticos
const ARTISTIC_STYLES = [
  // Fotografía
  "shot on 35mm film",
  "polaroid aesthetic",
  "vintage photography",
  "cinematic film still",
  "documentary photography style",
  "analog film grain",

  // Pintura/Arte
  "impressionist painting style",
  "pop art aesthetic",
  "street art graffiti style",
  "watercolor painting",
  "oil painting texture",
  "abstract expressionism",

  // Digital/Moderno
  "digital art illustration",
  "cyberpunk aesthetic",
  "vaporwave style",
  "synthwave retro",
  "glitch art effect",
  "neo-noir style",

  // Vintage/Retro
  "80s MTV aesthetic",
  "90s grunge style",
  "70s psychedelic poster",
  "vintage concert poster",
  "retro album cover art",
  "60s counterculture",

  // Técnicas
  "double exposure effect",
  "long exposure photography",
  "tilt-shift miniature",
  "infrared photography",
  "cyanotype process",
]

// Técnicas de iluminación
const LIGHTING_TECHNIQUES = [
  // Dramáticas
  "chiaroscuro lighting",
  "rim lighting effect",
  "god rays breaking through",
  "volumetric lighting",
  "dramatic side lighting",
  "silhouette backlight",

  // Naturales
  "golden hour magic light",
  "blue hour atmosphere",
  "soft diffused natural light",
  "harsh midday sun",
  "overcast flat light",

  // Artificiales
  "neon glow illumination",
  "stage spotlight drama",
  "colored gel lighting",
  "strobe flash freeze",
  "blacklight UV glow",

  // Atmosféricas
  "moody low-key lighting",
  "high-key bright lighting",
  "gradient color lighting",
  "practical lighting sources",
  "ambient occlusion shadows",

  // Creativas
  "bokeh light orbs",
  "lens flare accent",
  "light painting trails",
  "projected pattern lighting",
  "candlelight warmth",
];

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

/**
 * Selecciona un estilo artístico aleatorio
 */
function getRandomArtisticStyle() {
  const randomIndex = Math.floor(Math.random() * ARTISTIC_STYLES.length);
  return ARTISTIC_STYLES[randomIndex];
}

/**
 * Selecciona una técnica de iluminación aleatoria
 */
function getRandomLighting() {
  const randomIndex = Math.floor(Math.random() * LIGHTING_TECHNIQUES.length);
  return LIGHTING_TECHNIQUES[randomIndex];
}

/**
 * Encuentra la familia de géneros de un género específico
 */
function findGenreFamily(genre) {
  for (const [family, genres] of Object.entries(GENRE_FAMILIES)) {
    if (genres.includes(genre)) {
      return genres;
    }
  }
  return [genre]; // Si no encuentra familia, retorna solo el género
}

/**
 * Selecciona elementos aleatorios de un array (entre 50% y 100% de elementos)
 */
function selectRandomElements(array, minPercentage = 50) {
  if (array.length === 0) return [];

  const minCount = Math.max(1, Math.ceil(array.length * minPercentage / 100));
  const maxCount = array.length;
  const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;

  // Mezclar array y tomar los primeros 'count' elementos
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Obtiene elementos de un género relacionado (cross-pollination)
 * 20% de probabilidad de agregar elementos de géneros hermanos
 */
function getCrossPollination(genre, elementType) {
  const probability = 0.2; // 20% de probabilidad

  if (Math.random() > probability) {
    return []; // No hacer cross-pollination esta vez
  }

  const family = findGenreFamily(genre);
  const relatedGenres = family.filter(g => g !== genre && PROMPTS_DATA[g]);

  if (relatedGenres.length === 0) {
    return [];
  }

  // Seleccionar un género relacionado aleatorio
  const relatedGenre = relatedGenres[Math.floor(Math.random() * relatedGenres.length)];
  const relatedData = PROMPTS_DATA[relatedGenre];

  if (!relatedData || !relatedData[elementType]) {
    return [];
  }

  // Tomar 1-2 elementos del género relacionado
  const count = Math.floor(Math.random() * 2) + 1;
  return selectRandomElements(relatedData[elementType], 100).slice(0, count);
}

/**
 * Construye prompt con variación aleatoria y cross-pollination
 */
function buildPromptText(genre) {
  const promptData = PROMPTS_DATA[genre];
  if (!promptData) {
    throw new Error(`No hay prompt para: ${genre}`);
  }

  // 1. Seleccionar elementos aleatorios del género principal (50-100%)
  let sceneElements = selectRandomElements(promptData.sceneElements, 50);
  let visualStyle = selectRandomElements(promptData.visualStyle, 50);
  let emotionMood = selectRandomElements(promptData.emotionMood, 50);

  // 2. Cross-pollination: agregar elementos de géneros relacionados (20% probabilidad)
  const crossScene = getCrossPollination(genre, 'sceneElements');
  const crossStyle = getCrossPollination(genre, 'visualStyle');
  const crossMood = getCrossPollination(genre, 'emotionMood');

  sceneElements = [...sceneElements, ...crossScene];
  visualStyle = [...visualStyle, ...crossStyle];
  emotionMood = [...emotionMood, ...crossMood];

  // 3. Seleccionar estilo artístico y técnica de iluminación
  const artisticStyle = getRandomArtisticStyle();
  const lighting = getRandomLighting();

  // 4. Construir texto
  const sceneText = sceneElements.join(', ');
  const styleText = visualStyle.join(', ');
  const moodText = emotionMood.join(', ');

  return `${sceneText}. Visual style: ${styleText}. Mood: ${moodText}. Artistic style: ${artisticStyle}. Lighting: ${lighting}.`;
}

/**
 * Genera imagen con FAL AI (Flux Schnell) - Queue API
 */
async function generateWithFAL(promptText, genre) {
  const FAL_API_TOKEN = process.env.FAL_API_TOKEN;
  const startTime = Date.now();

  // 1. Crear request en la cola
  const queueResponse = await axios.post(
    'https://queue.fal.run/fal-ai/flux/schnell',
    {
      prompt: promptText,
      image_size: 'square_hd',
      num_inference_steps: 4,
      num_images: 1,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${FAL_API_TOKEN}`,
      },
      timeout: 10000,
    }
  );

  const requestId = queueResponse.data.request_id;
  const statusUrl = queueResponse.data.status_url;

  // 2. Polling hasta que termine
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    const statusResponse = await axios.get(statusUrl, {
      headers: {
        Authorization: `Key ${FAL_API_TOKEN}`,
      },
      timeout: 10000,
    });

    const { status } = statusResponse.data;

    if (status === 'COMPLETED') {
      // Obtener resultado final
      const resultResponse = await axios.get(queueResponse.data.response_url, {
        headers: {
          Authorization: `Key ${FAL_API_TOKEN}`,
        },
      });

      return {
        imageUrl: resultResponse.data.images[0].url,
        processingTime: Date.now() - startTime,
        generator: 'FAL-AI-Flux',
        metadata: { aiModel: 'flux-schnell' },
      };
    }

    if (status === 'FAILED') {
      throw new Error('FAL AI request failed');
    }

    // Esperar antes de siguiente polling
    await new Promise((resolve) => setTimeout(resolve, 2000));
    attempts++;
  }

  throw new Error('FAL AI timeout: request did not complete in time');
}

/**
 * Sube imagen a Cloudinary
 */
async function uploadToCloudinary(imageUrl, genre) {
  const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
  const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

  const folder = `vibra/ai-generated/${genre}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();

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
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  return {
    imageUrl: response.data.secure_url,
    thumbnailUrl: response.data.secure_url.replace('/upload/', '/upload/w_400,h_400,c_fill/'),
    publicId: response.data.public_id,
  };
}

/**
 * Selecciona géneros aleatorios de un tier
 */
function selectRandomGenres(tierKey, count) {
  const tierData = TIERS_CONFIG[tierKey];
  if (!tierData) return [];

  const genres = [...tierData.genres]; // Copia para no mutar
  const selected = [];

  for (let i = 0; i < count; i++) {
    if (genres.length === 0) {
      // Si se acabaron los géneros, reiniciar la lista
      genres.push(...tierData.genres);
    }
    const randomIndex = Math.floor(Math.random() * genres.length);
    selected.push(genres.splice(randomIndex, 1)[0]);
  }

  return selected;
}

/**
 * Genera una imagen
 */
async function generateImage(genre) {
  const promptText = buildPromptText(genre);

  // Generar con FAL AI
  const aiResult = await generateWithFAL(promptText, genre);

  // Subir a Cloudinary
  const cloudinaryResult = await uploadToCloudinary(aiResult.imageUrl, genre);

  // Guardar en MongoDB
  const generatedImage = new GeneratedImage({
    genre,
    imageUrl: cloudinaryResult.imageUrl,
    thumbnailUrl: cloudinaryResult.thumbnailUrl,
    cloudinaryPublicId: cloudinaryResult.publicId,
    cloudinaryFolder: `vibra/ai-generated/${genre}`,
    prompt: promptText,
    generator: aiResult.generator,
    metadata: aiResult.metadata,
    processingTime: aiResult.processingTime,
    isActive: true,
  });

  await generatedImage.save();

  return {
    success: true,
    generator: aiResult.generator,
    processingTime: aiResult.processingTime,
  };
}

/**
 * Main
 */
async function main() {
  console.log('🎨 Generación de imágenes con FAL AI (Flux Schnell)\n');
  console.log('📊 Distribución:');
  console.log(`   Tier 1: ${IMAGES_PER_TIER.tier1} imágenes`);
  console.log(`   Tier 2: ${IMAGES_PER_TIER.tier2} imágenes`);
  console.log(`   Tier 3: ${IMAGES_PER_TIER.tier3} imágenes`);
  console.log(`   Tier 4: ${IMAGES_PER_TIER.tier4} imágenes`);
  console.log(`   Total: ${Object.values(IMAGES_PER_TIER).reduce((a, b) => a + b, 0)} imágenes\n`);

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const stats = {
      total: 0,
      success: 0,
      failed: 0,
      totalCost: 0,
      totalTime: 0,
    };

    const startTime = Date.now();

    // Procesar cada tier
    for (const [tierKey, imageCount] of Object.entries(IMAGES_PER_TIER)) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`🎯 ${tierKey.toUpperCase()} - ${imageCount} imágenes aleatorias`);
      console.log('='.repeat(70));

      // Seleccionar géneros aleatorios
      const selectedGenres = selectRandomGenres(tierKey, imageCount);

      console.log(`📌 Géneros seleccionados: ${selectedGenres.join(', ')}\n`);

      for (let i = 0; i < selectedGenres.length; i++) {
        const genre = selectedGenres[i];

        try {
          console.log(`   [${i + 1}/${imageCount}] Generando "${genre}" con FAL AI...`);

          const result = await generateImage(genre);

          console.log(`   ✅ ${result.generator} - ${(result.processingTime / 1000).toFixed(1)}s`);

          stats.success++;
          stats.total++;
          stats.totalTime += result.processingTime;

          // Pausa entre requests
          if (i < selectedGenres.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          stats.failed++;
          stats.total++;
        }
      }
    }

    const totalMinutes = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const costFal = stats.success * 0.003;

    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN FINAL:');
    console.log('='.repeat(70));
    console.log(`✅ Exitosas: ${stats.success}`);
    console.log(`❌ Fallidas: ${stats.failed}`);
    console.log(`⏱️  Tiempo total: ${totalMinutes} minutos`);
    console.log(`💰 Costo total: $${costFal.toFixed(2)} USD`);
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
