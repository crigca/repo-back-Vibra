const axios = require('axios');

async function checkGenresStatus() {
  try {
    const response = await axios.get('http://localhost:3000/music/songs/all-raw');
    const songs = response.data;

    const genreCounts = {};
    songs.forEach(song => {
      const genre = song.genre || 'Sin género';
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });

    console.log('\n📊 ESTADO DE GÉNEROS EN LA BASE DE DATOS');
    console.log('======================================================================');
    console.log(`Total de canciones: ${songs.length}\n`);

    const sortedGenres = Object.entries(genreCounts).sort((a, b) => a[0].localeCompare(b[0]));

    sortedGenres.forEach(([genre, count]) => {
      const emoji = genre === 'Sin categoría' ? '⚠️ ' : genre === 'Otros' ? '⚠️ ' : '✅';
      console.log(`${emoji} ${genre}: ${count} canciones`);
    });

    console.log('======================================================================\n');

    // Verificar específicamente "Otros" y "Sin categoría"
    const otrosCount = genreCounts['Otros'] || 0;
    const sinCategoriaCount = genreCounts['Sin categoría'] || 0;

    console.log('📌 ESTADO DE GÉNEROS DE FALLBACK:');
    console.log(`   • "Otros": ${otrosCount} canciones ${otrosCount === 0 ? '✅' : '⚠️'}`);
    console.log(`   • "Sin categoría": ${sinCategoriaCount} canciones ${sinCategoriaCount > 0 ? '⚠️' : '✅'}`);
    console.log('======================================================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkGenresStatus();
