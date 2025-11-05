const axios = require('axios');

async function checkOtros() {
  try {
    console.log('🔍 Consultando canciones con género "Otros"...\n');

    const response = await axios.get('http://localhost:3000/music/songs/all-raw', {
      params: { limit: 10000 }
    });

    const songs = response.data;
    const otrosSongs = songs.filter(s => s.genre === 'Otros' || s.genre === 'otros');
    const nullGenre = songs.filter(s => !s.genre || s.genre === null);

    console.log(`📊 ESTADÍSTICAS DE GÉNEROS:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`Total de canciones: ${songs.length}`);
    console.log(`Con género "Otros": ${otrosSongs.length}`);
    console.log(`Sin género (null): ${nullGenre.length}\n`);

    if (otrosSongs.length > 0) {
      console.log(`📋 PRIMERAS 10 CANCIONES CON GÉNERO "OTROS":`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      otrosSongs.slice(0, 10).forEach((song, i) => {
        console.log(`${i + 1}. "${song.title}"`);
        console.log(`   Artista: ${song.artist}`);
        console.log(`   Vistas: ${song.viewCount || 0}`);
        console.log('');
      });

      if (otrosSongs.length > 10) {
        console.log(`... y ${otrosSongs.length - 10} más\n`);
      }
    }

    if (nullGenre.length > 0) {
      console.log(`📋 PRIMERAS 10 CANCIONES SIN GÉNERO:`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      nullGenre.slice(0, 10).forEach((song, i) => {
        console.log(`${i + 1}. "${song.title}"`);
        console.log(`   Artista: ${song.artist}`);
        console.log(`   Vistas: ${song.viewCount || 0}`);
        console.log('');
      });

      if (nullGenre.length > 10) {
        console.log(`... y ${nullGenre.length - 10} más\n`);
      }
    }

    // Contar por género
    const genreCount = {};
    songs.forEach(song => {
      const genre = song.genre || 'SIN GÉNERO';
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });

    console.log(`📊 DISTRIBUCIÓN POR GÉNERO:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    const sortedGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    sortedGenres.forEach(([genre, count]) => {
      console.log(`${genre.padEnd(25)} ${count.toString().padStart(5)} canciones`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('💡 Asegúrate de que el servidor esté corriendo: npm run start:dev');
  }
}

checkOtros();
