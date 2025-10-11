/**
 * Script de generación de imágenes con Replicate SDXL
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
  "shot on 35mm film", "polaroid aesthetic", "vintage photography",
  "cinematic film still", "documentary photography style", "analog film grain",
  "impressionist painting style", "pop art aesthetic", "street art graffiti style",
  "watercolor painting", "oil painting texture", "abstract expressionism",
  "digital art illustration", "cyberpunk aesthetic", "vaporwave style",
  "synthwave retro", "glitch art effect", "neo-noir style",
  "80s MTV aesthetic", "90s grunge style", "70s psychedelic poster",
  "vintage concert poster", "retro album cover art", "60s counterculture",
  "double exposure effect", "long exposure photography", "tilt-shift miniature",
  "infrared photography", "cyanotype process",
];

// Técnicas de iluminación
const LIGHTING_TECHNIQUES = [
  "chiaroscuro lighting", "rim lighting effect", "god rays breaking through",
  "volumetric lighting", "dramatic side lighting", "silhouette backlight",
  "golden hour magic light", "blue hour atmosphere", "soft diffused natural light",
  "harsh midday sun", "overcast flat light",
  "neon glow illumination", "stage spotlight drama", "colored gel lighting",
  "strobe flash freeze", "blacklight UV glow",
  "moody low-key lighting", "high-key bright lighting", "gradient color lighting",
  "practical lighting sources", "ambient occlusion shadows",
  "bokeh light orbs", "lens flare accent", "light painting trails",
  "projected pattern lighting", "candlelight warmth",
];

// Conceptos visuales abstractos
const VISUAL_CONCEPTS = [
  "abstract visualization of sound waves", "flowing musical energy in space",
  "rhythm represented through geometric shapes", "vibrations and frequencies visualization",
  "sound particles floating", "musical notes morphing into colors", "audio spectrum display",
  "extreme close-up of instrument strings", "macro shot of vinyl record grooves",
  "speaker cone vibrating", "guitar pick frozen mid-strum", "drumstick hitting cymbal splash",
  "microphone mesh detail", "audio cable connectors",
  "layered textures representing sound layers", "fabric and materials music collage",
  "urban surfaces with music graffiti", "natural elements musical composition",
  "industrial metallic music surfaces", "worn leather and wood textures",
  "emotion expressed through pure color", "movement captured in abstract stillness",
  "energy radiating from center", "chaos and harmony visual balance", "raw musical expression",
  "empty stage before the concert", "abandoned recording studio atmosphere",
  "instruments resting in silence", "vinyl collection display", "music equipment scattered artistically",
  "bold typography music poster", "minimalist icon design", "geometric abstraction of sound",
  "deconstructed instrument parts", "floating musical elements in void",
  "intentional motion blur energy", "fragmented musical reality", "kaleidoscope of instruments",
  "time-lapse light painting music", "shattered vinyl explosion",
];

// Composiciones fotográficas
const PHOTOGRAPHIC_COMPOSITIONS = [
  "extreme close-up detail", "bird's eye view from above", "worm's eye view from below",
  "dutch angle tilted perspective", "silhouette against backlight", "through glass reflection",
  "macro texture detail", "wide establishing shot", "tight symmetrical framing",
  "rule of thirds composition", "leading lines perspective", "frame within frame",
  "negative space emphasis", "golden ratio composition", "centered composition",
  "diagonal dynamic composition", "overhead flat lay", "low angle power shot",
  "over the shoulder perspective", "through foreground elements", "depth of field isolation",
  "bokeh background blur", "layered depth composition", "minimalist negative space",
  "pattern repetition", "texture as subject",
];

// Objetos de ambiente musical
const MUSIC_ENVIRONMENT_OBJECTS = [
  "vinyl records scattered on floor", "tangled audio cables", "vintage amplifier knobs and dials",
  "effect pedals board setup", "audio mixer faders and buttons", "backstage pass hanging",
  "handwritten setlist on stage floor", "drumsticks on snare drum", "guitar picks collection",
  "microphone stand against wall", "speaker stack tower", "vintage radio equipment",
  "cassette tapes pile", "CD jewel cases", "music posters on brick wall",
  "neon sign glowing", "stage lights rigging", "sound dampening foam panels",
  "recording studio booth", "headphones resting", "musical instrument cases",
  "tour bus interior", "green room backstage", "merch table display",
  "festival wristbands", "ticket stubs scattered", "vinyl player turntable",
  "sheet music pages", "lyric notebooks", "band stickers collage",
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
 * Selecciona un concepto visual abstracto aleatorio
 */
function getRandomVisualConcept() {
  const randomIndex = Math.floor(Math.random() * VISUAL_CONCEPTS.length);
  return VISUAL_CONCEPTS[randomIndex];
}

/**
 * Selecciona una composición fotográfica aleatoria
 */
function getRandomComposition() {
  const randomIndex = Math.floor(Math.random() * PHOTOGRAPHIC_COMPOSITIONS.length);
  return PHOTOGRAPHIC_COMPOSITIONS[randomIndex];
}

/**
 * Selecciona objetos de ambiente musical aleatorios
 */
function getRandomMusicObjects() {
  const count = Math.floor(Math.random() * 2) + 1; // 1-2 objetos
  const shuffled = [...MUSIC_ENVIRONMENT_OBJECTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
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
  return [genre];
}

/**
 * Selecciona elementos aleatorios de un array (entre 50% y 100% de elementos)
 */
function selectRandomElements(array, minPercentage = 50) {
  if (array.length === 0) return [];

  const minCount = Math.max(1, Math.ceil(array.length * minPercentage / 100));
  const maxCount = array.length;
  const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;

  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Obtiene elementos de un género relacionado (cross-pollination)
 */
function getCrossPollination(genre, elementType) {
  const probability = 0.2;

  if (Math.random() > probability) {
    return [];
  }

  const family = findGenreFamily(genre);
  const relatedGenres = family.filter(g => g !== genre && PROMPTS_DATA[g]);

  if (relatedGenres.length === 0) {
    return [];
  }

  const relatedGenre = relatedGenres[Math.floor(Math.random() * relatedGenres.length)];
  const relatedData = PROMPTS_DATA[relatedGenre];

  if (!relatedData || !relatedData[elementType]) {
    return [];
  }

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

  // 50% de probabilidad para conceptos abstractos
  const useAbstractConcept = Math.random() < 0.5;

  let sceneText;

  if (useAbstractConcept) {
    sceneText = getRandomVisualConcept();
  } else {
    // Combinar elementos originales con objetos de ambiente
    let sceneElements = selectRandomElements(promptData.sceneElements, 50);
    const crossScene = getCrossPollination(genre, 'sceneElements');
    const musicObjects = getRandomMusicObjects();

    sceneElements = [...sceneElements, ...crossScene, ...musicObjects];
    sceneText = sceneElements.join(', ');
  }

  let visualStyle = selectRandomElements(promptData.visualStyle, 50);
  let emotionMood = selectRandomElements(promptData.emotionMood, 50);

  const crossStyle = getCrossPollination(genre, 'visualStyle');
  const crossMood = getCrossPollination(genre, 'emotionMood');

  visualStyle = [...visualStyle, ...crossStyle];
  emotionMood = [...emotionMood, ...crossMood];

  const artisticStyle = getRandomArtisticStyle();
  const lighting = getRandomLighting();
  const composition = getRandomComposition();

  const styleText = visualStyle.join(', ');
  const moodText = emotionMood.join(', ');

  return `${sceneText}. Visual style: ${styleText}. Mood: ${moodText}. Composition: ${composition}. Artistic style: ${artisticStyle}. Lighting: ${lighting}.`;
}

/**
 * Genera imagen con Replicate SDXL
 */
async function generateWithReplicate(promptText, genre) {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  const startTime = Date.now();

  // Crear predicción
  const createResponse = await axios.post(
    'https://api.replicate.com/v1/predictions',
    {
      version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      input: {
        prompt: promptText,
        width: 1024,
        height: 1024,
        num_inference_steps: 30,
        guidance_scale: 7.5,
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
      },
    }
  );

  const predictionId = createResponse.data.id;

  // Polling hasta que termine
  let prediction;
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    const pollResponse = await axios.get(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
      }
    );

    prediction = pollResponse.data;

    if (prediction.status === 'succeeded') {
      return {
        imageUrl: prediction.output[0],
        processingTime: Date.now() - startTime,
        generator: 'Replicate-SDXL',
        metadata: { aiModel: 'stable-diffusion-xl' },
      };
    }

    if (prediction.status === 'failed') {
      throw new Error('Replicate prediction failed');
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
    attempts++;
  }

  throw new Error('Replicate timeout');
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

  // Generar con Replicate
  const aiResult = await generateWithReplicate(promptText, genre);

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
  console.log('🎨 Generación de imágenes con Replicate SDXL\n');
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
          console.log(`   [${i + 1}/${imageCount}] Generando "${genre}" con Replicate...`);

          const result = await generateImage(genre);

          console.log(`   ✅ ${result.generator} - ${(result.processingTime / 1000).toFixed(1)}s`);

          stats.success++;
          stats.total++;
          stats.totalTime += result.processingTime;

          // Pausa entre requests
          if (i < selectedGenres.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          stats.failed++;
          stats.total++;
        }
      }
    }

    const totalMinutes = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const costReplicate = stats.success * 0.003;

    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN FINAL:');
    console.log('='.repeat(70));
    console.log(`✅ Exitosas: ${stats.success}`);
    console.log(`❌ Fallidas: ${stats.failed}`);
    console.log(`⏱️  Tiempo total: ${totalMinutes} minutos`);
    console.log(`💰 Costo total: $${costReplicate.toFixed(2)} USD`);
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
