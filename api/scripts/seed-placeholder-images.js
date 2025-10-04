const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Mapeo de samples existentes en Cloudinary a géneros
const SAMPLE_TO_GENRE_MAP = {
  'cld-sample': ['Pop', 'Pop Latino', 'PopLatinoActual', 'PopLatinoClasico', 'Pop90s'],
  'cld-sample-2': ['Rock', 'RockArgentino', 'RockLatino', 'Rock Nacional', 'AlternativeRock', 'Alternative Rock', 'IndieRock', 'SoftRock'],
  'cld-sample-3': ['Electronic', 'House', 'Techno', 'Trance', 'EdmActual', 'Dubstep'],
  'cld-sample-4': ['Hiphop', 'Rap', 'Trap', 'Drill'],
  'cld-sample-5': ['Jazz', 'Blues', 'Soul', 'Rb', 'Funk'],
  'samples/waves': ['Reggae', 'Reggaeton', 'Dancehall', 'Ska'],
  'samples/radial': ['Metal', 'Heavy Metal', 'HeavyMetal', 'HeavyMetalArgentino', 'DeathMetal', 'BlackMetal', 'ThrashMetal', 'IndustrialMetal', 'GlamMetal'],
  'samples/radial_02': ['Latin', 'Salsa', 'Bachata', 'Merengue', 'Cumbia', 'Cumbia420', 'CumbiaVillera'],
  'samples/paper': ['Country', 'Folk', 'Bluegrass', 'Gospel'],
  'main-sample': ['Alternative', 'Alternative Pop', 'Punk', 'HardcorePunk', 'Indie'],
};

// Imagen por defecto para géneros sin mapeo
const DEFAULT_IMAGE = 'cld-sample';

async function seedPlaceholders() {
  console.log('🖼️  Seeding placeholder images to Cloudinary...\n');

  try {
    // Cargar géneros
    const genresPath = path.join(__dirname, 'genres.json');
    const genres = JSON.parse(fs.readFileSync(genresPath, 'utf-8'));

    console.log(`📊 Total genres to process: ${genres.length}\n`);

    // Crear mapeo inverso: género -> sample
    const genreToSample = {};

    for (const [sample, genreList] of Object.entries(SAMPLE_TO_GENRE_MAP)) {
      for (const genre of genreList) {
        genreToSample[genre] = sample;
      }
    }

    // Asignar samples a todos los géneros
    const assignments = [];
    for (const genre of genres) {
      const sample = genreToSample[genre] || DEFAULT_IMAGE;

      // Obtener URL del sample
      const url = cloudinary.url(sample, {
        fetch_format: 'auto',
        quality: 'auto',
        width: 1200,
        height: 1200,
        crop: 'fill',
      });

      const thumbnailUrl = cloudinary.url(sample, {
        fetch_format: 'auto',
        quality: 'auto',
        width: 400,
        height: 400,
        crop: 'fill',
      });

      assignments.push({
        genre,
        publicId: sample,
        imageUrl: url,
        thumbnailUrl,
        folder: sample.includes('/') ? sample.split('/')[0] : 'root',
      });
    }

    // Guardar en JSON
    const outputPath = path.join(__dirname, 'placeholder-assignments.json');
    fs.writeFileSync(outputPath, JSON.stringify(assignments, null, 2));

    console.log(`✅ Saved ${assignments.length} assignments to: ${outputPath}\n`);

    // Mostrar estadísticas
    console.log('📊 Assignment Statistics:\n');
    const stats = {};
    assignments.forEach((a) => {
      stats[a.publicId] = (stats[a.publicId] || 0) + 1;
    });

    console.log('Sample usage:');
    Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([sample, count]) => {
        console.log(`   ${sample}: ${count} genres`);
      });

    console.log('\n📋 Sample assignments:');
    assignments.slice(0, 10).forEach((a) => {
      console.log(`   ${a.genre} → ${a.publicId}`);
    });
    console.log(`   ... and ${assignments.length - 10} more\n`);

    console.log('🎉 Done! Placeholder assignments created.\n');
    console.log('ℹ️  These URLs will be used by StubImageGenerator to simulate image generation.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedPlaceholders();
