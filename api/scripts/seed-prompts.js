const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Schema de Prompt (mismo que en TypeScript)
const promptSchema = new mongoose.Schema(
  {
    genre: { type: String, required: true },
    promptText: { type: String, required: true, maxlength: 3000 },
    category: {
      type: String,
      required: true,
      enum: ['base', 'variation', 'mood', 'style'],
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    language: { type: String, default: 'en' },
    tags: { type: [String], default: [] },
    usageCount: { type: Number, default: 0 },
    successRate: { type: Number, default: 0.0, min: 0, max: 1 },
    lastUsedAt: Date,
    aiCompatibility: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true, collection: 'prompts' }
);

// Índices
promptSchema.index({ genre: 1, isActive: 1 });
promptSchema.index({ tags: 1 });
promptSchema.index({ usageCount: -1 });
promptSchema.index({ promptText: 'text' });

const Prompt = mongoose.model('Prompt', promptSchema);

// Template de prompts por categoría
const PROMPT_TEMPLATES = {
  base: (genre) => {
    const templates = {
      Rock: 'Abstract visualization of electric guitars, drums, and energetic vibrant colors representing raw rock energy. Dynamic composition with bold reds, blacks, and electric blues.',
      Pop: 'Colorful and vibrant abstract art with playful geometric shapes, bright pastels, and modern trendy aesthetics. Energetic and uplifting composition.',
      Electronic: 'Futuristic digital landscape with neon lights, geometric patterns, circuit-like designs. Glowing cyan, purple, and electric colors in a cyberpunk aesthetic.',
      Jazz: 'Smooth and sophisticated abstract composition with warm golden tones, saxophone silhouettes, smoky atmosphere, and elegant flowing shapes.',
      Metal: 'Dark and aggressive imagery with sharp angular shapes, chains, skulls, fire, and metallic textures. Intense blacks, deep reds, and silver highlights.',
      Hiphop: 'Urban street art aesthetic with graffiti elements, bold typography, vibrant colors, and dynamic movement. Contemporary and edgy composition.',
      Latin: 'Vibrant tropical colors, rhythmic patterns, cultural elements, festive atmosphere. Warm oranges, bright yellows, passionate reds.',
      Country: 'Rustic and warm imagery with natural elements, earth tones, vintage aesthetics, and countryside vibes. Browns, greens, and golden sunset hues.',
      Classical: 'Elegant and timeless composition with orchestral elements, vintage concert hall aesthetics, gold accents, and sophisticated color palette.',
      Reggae: 'Relaxed tropical vibes with green, yellow, and red color scheme. Natural elements, sunshine, beach aesthetics, and peaceful atmosphere.',
    };

    // Normalizar género para buscar en templates
    const normalizedGenre = genre.toLowerCase();
    for (const [key, template] of Object.entries(templates)) {
      if (normalizedGenre.includes(key.toLowerCase())) {
        return template;
      }
    }

    // Template genérico
    return `Abstract artistic visualization representing ${genre} music. Vibrant colors, dynamic composition, and modern aesthetics that capture the essence and energy of the genre.`;
  },

  variation: (genre) => {
    return `Alternative perspective of ${genre} music: surreal dreamlike atmosphere with flowing abstract forms, color gradients, and artistic interpretation of sound waves and musical emotions.`;
  },

  mood: (genre) => {
    return `Emotional essence of ${genre}: atmospheric depth, layered textures, mood-driven color palette that evokes the feelings and spirit of the music genre.`;
  },

  style: (genre) => {
    return `Stylized artistic representation of ${genre} with modern art influences, bold visual language, contemporary design elements, and creative interpretation of musical identity.`;
  },
};

async function seedPrompts() {
  console.log('🌱 Seeding prompts to MongoDB...\n');

  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Cargar géneros
    const genresPath = path.join(__dirname, 'genres.json');
    const genres = JSON.parse(fs.readFileSync(genresPath, 'utf-8'));

    console.log(`📊 Processing ${genres.length} genres\n`);

    // Limpiar colección existente
    await Prompt.deleteMany({});
    console.log('🗑️  Cleared existing prompts\n');

    // Generar prompts
    const prompts = [];

    for (const genre of genres) {
      // Crear 2 prompts por género: base + variation
      const categories = ['base', 'variation'];

      for (const category of categories) {
        const promptText = PROMPT_TEMPLATES[category](genre);

        prompts.push({
          genre,
          promptText,
          category,
          isActive: true,
          language: 'en',
          tags: [genre.toLowerCase(), category],
          usageCount: 0,
          successRate: 0.0,
          aiCompatibility: {
            'dall-e-3': { supported: true },
            deepai: { supported: true },
            'stable-diffusion': { supported: true },
          },
        });
      }
    }

    console.log(`📝 Generated ${prompts.length} prompts (${genres.length} genres × 2 categories)\n`);

    // Insertar en MongoDB
    const result = await Prompt.insertMany(prompts);
    console.log(`✅ Inserted ${result.length} prompts successfully\n`);

    // Verificar
    const count = await Prompt.countDocuments();
    const uniqueGenres = await Prompt.distinct('genre');

    console.log('📊 Database Statistics:');
    console.log(`   Total prompts: ${count}`);
    console.log(`   Unique genres: ${uniqueGenres.length}`);
    console.log(`   Categories: ${await Prompt.distinct('category')}`);
    console.log('');

    // Mostrar ejemplos
    console.log('📋 Sample prompts:\n');
    const samples = await Prompt.find().limit(5);
    samples.forEach((p, i) => {
      console.log(`${i + 1}. Genre: ${p.genre} | Category: ${p.category}`);
      console.log(`   Prompt: ${p.promptText.substring(0, 80)}...`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('🎉 Done! Prompts seeded successfully.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedPrompts();
