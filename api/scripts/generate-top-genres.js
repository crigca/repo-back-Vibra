/**
 * Script para generar imágenes con DALL-E de los 15 géneros más populares
 * Costo estimado: $0.60 USD (15 × $0.04)
 */

const axios = require('axios');

const TOP_15_GENRES = [
  'PopLatinoClasico',
  'Salsa',
  'RockArgentino',
  'Cumbia',
  'LatinIndie',
  'Afrobeat',
  'Reggae',
  'Norteño',
  'Hiphop',
  'SoftRock',
  'Highlife',
  'Rb',
  'Punk',
  'Pop',
  'Lofi'
];

const API_URL = 'http://localhost:3000';

async function generateImagesForTopGenres() {
  console.log('🎨 Generando imágenes para los 15 géneros más populares...\n');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < TOP_15_GENRES.length; i++) {
    const genre = TOP_15_GENRES[i];

    try {
      console.log(`[${i + 1}/15] Generando imagen para: ${genre}...`);

      // Buscar una canción del género
      const songsResponse = await axios.get(`${API_URL}/music/songs`, {
        params: { limit: 1000 }
      });

      const song = songsResponse.data.find(s => s.genre === genre);

      if (!song) {
        console.log(`   ❌ No se encontró canción del género ${genre}`);
        failCount++;
        continue;
      }

      // Generar imagen con DALL-E
      const startTime = Date.now();
      const response = await axios.post(`${API_URL}/images/generate`, {
        songId: song.id
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      if (response.data.success) {
        console.log(`   ✅ Generada en ${duration}s - ${response.data.data.imageUrl.substring(0, 80)}...`);
        successCount++;
      } else {
        console.log(`   ❌ Error: ${response.data.error}`);
        failCount++;
      }

      // Esperar 2 segundos entre requests (evitar rate limit)
      if (i < TOP_15_GENRES.length - 1) {
        console.log('   ⏳ Esperando 2 segundos...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN:');
  console.log(`   ✅ Exitosas: ${successCount}/15`);
  console.log(`   ❌ Fallidas: ${failCount}/15`);
  console.log(`   💰 Costo estimado: $${(successCount * 0.04).toFixed(2)} USD`);
  console.log('='.repeat(60));
}

// Ejecutar
generateImagesForTopGenres()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  });
