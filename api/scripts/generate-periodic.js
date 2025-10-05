/**
 * Script de generación periódica con DALL-E
 *
 * Ejecutar manualmente cada X tiempo para generar más imágenes
 * Estrategia: Selecciona canciones aleatorias y genera imágenes nuevas
 *
 * Uso:
 *   node scripts/generate-periodic.js 10    # Genera 10 imágenes
 *   node scripts/generate-periodic.js 50    # Genera 50 imágenes
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000';
const DEFAULT_COUNT = 20;

// Obtener cantidad desde argumentos
const count = parseInt(process.argv[2]) || DEFAULT_COUNT;

async function generatePeriodicImages() {
  console.log(`🎨 Generación periódica de ${count} imágenes con DALL-E\n`);

  try {
    // Obtener todas las canciones
    const songsResponse = await axios.get(`${API_URL}/music/songs`, {
      params: { limit: 1000 }
    });

    const songs = songsResponse.data;
    console.log(`📋 Total de canciones disponibles: ${songs.length}\n`);

    // Obtener estadísticas actuales
    const statsResponse = await axios.get(`${API_URL}/images/stats`);
    const stats = statsResponse.data.data;

    console.log('📊 Estado actual:');
    console.log(`   Total imágenes: ${stats.total}`);
    console.log(`   Géneros únicos: ${stats.uniqueGenres}`);
    console.log(`   Canciones únicas: ${stats.uniqueSongs}\n`);

    // Crear mapa de géneros con su conteo de imágenes
    const genreCount = new Map();
    stats.byGenre.forEach(g => {
      if (g.genre) {
        genreCount.set(g.genre, g.count);
      }
    });

    // Priorizar géneros con MENOS imágenes (para balancear)
    const songsByPriority = songs.sort((a, b) => {
      const countA = genreCount.get(a.genre) || 0;
      const countB = genreCount.get(b.genre) || 0;
      return countA - countB; // Menor a mayor
    });

    console.log('🎯 Estrategia: Priorizar géneros con menos imágenes\n');

    let successCount = 0;
    let failCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < count && i < songsByPriority.length; i++) {
      const song = songsByPriority[i];
      const currentCount = genreCount.get(song.genre) || 0;

      try {
        console.log(`[${i + 1}/${count}] 🎨 ${song.genre} (${currentCount} imgs) - "${song.title.substring(0, 40)}..."`);

        const genStartTime = Date.now();
        const response = await axios.post(`${API_URL}/images/generate`, {
          songId: song.id
        });

        const duration = ((Date.now() - genStartTime) / 1000).toFixed(1);

        if (response.data.success) {
          console.log(`   ✅ Generada en ${duration}s`);
          successCount++;
          genreCount.set(song.genre, currentCount + 1);
        } else {
          console.log(`   ❌ Error: ${response.data.error}`);
          failCount++;
        }

        // Pausa entre requests (evitar rate limit)
        if (i < count - 1) {
          console.log('   ⏳ Esperando 2 segundos...\n');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        failCount++;
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN:');
    console.log(`   ✅ Exitosas: ${successCount}/${count}`);
    console.log(`   ❌ Fallidas: ${failCount}/${count}`);
    console.log(`   ⏱️  Tiempo total: ${totalTime} minutos`);
    console.log(`   💰 Costo estimado: $${(successCount * 0.04).toFixed(2)} USD`);
    console.log(`   📦 Total en MongoDB: ~${stats.total + successCount} imágenes`);
    console.log('='.repeat(70));

    console.log('\n💡 Consejos:');
    console.log('   - Ejecuta este script periódicamente para acumular más imágenes');
    console.log('   - Ajusta la cantidad según tu presupuesto (node generate-periodic.js <num>)');
    console.log('   - Las imágenes se asignan priorizando géneros con menos contenido\n');

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  }
}

// Ejecutar
generatePeriodicImages()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
