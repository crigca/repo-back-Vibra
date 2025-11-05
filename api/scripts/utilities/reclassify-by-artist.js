const { DataSource } = require('typeorm');
const { artistsByGenre } = require('./data/artists-data');
require('dotenv').config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Función para encontrar el género basado en el artista
function findGenreByArtist(artistName) {
  const normalizedArtist = artistName.toLowerCase().trim();

  for (const [genre, artists] of Object.entries(artistsByGenre)) {
    const found = artists.some(a => {
      const normalizedGenreArtist = a.toLowerCase().trim();
      return normalizedGenreArtist === normalizedArtist ||
             normalizedArtist.includes(normalizedGenreArtist) ||
             normalizedGenreArtist.includes(normalizedArtist);
    });

    if (found) {
      return genre;
    }
  }

  return null;
}

async function reclassifyByArtist() {
  try {
    console.log('🎵 Reclasificando canciones sin categoría por artista...\n');

    await dataSource.initialize();
    console.log('✅ Conectado a la base de datos\n');

    // Obtener canciones sin categoría o con "otros"
    const uncategorizedSongs = await dataSource.query(`
      SELECT id, title, artist, genre
      FROM songs
      WHERE genre IN ('sinCategoria', 'otros')
      ORDER BY artist, title
    `);

    console.log(`📋 Total de canciones a revisar: ${uncategorizedSongs.length}\n`);

    const updates = [];
    const notFound = [];

    for (const song of uncategorizedSongs) {
      const detectedGenre = findGenreByArtist(song.artist);

      if (detectedGenre) {
        updates.push({
          id: song.id,
          title: song.title,
          artist: song.artist,
          oldGenre: song.genre,
          newGenre: detectedGenre
        });
      } else {
        notFound.push({
          id: song.id,
          title: song.title,
          artist: song.artist,
          genre: song.genre
        });
      }
    }

    console.log('═'.repeat(70));
    console.log(`✅ Canciones que se pueden reclasificar: ${updates.length}`);
    console.log(`❌ Canciones que no se encontraron en artists-data: ${notFound.length}`);
    console.log('═'.repeat(70));

    if (updates.length > 0) {
      console.log('\n📝 ACTUALIZACIONES A REALIZAR:\n');

      // Agrupar por género
      const byGenre = {};
      updates.forEach(u => {
        if (!byGenre[u.newGenre]) byGenre[u.newGenre] = [];
        byGenre[u.newGenre].push(u);
      });

      for (const [genre, songs] of Object.entries(byGenre)) {
        console.log(`\n🎸 ${genre} (${songs.length} canciones):`);
        songs.forEach(s => {
          console.log(`   - ${s.artist} - ${s.title}`);
        });
      }

      console.log('\n' + '═'.repeat(70));
      console.log('🔄 Aplicando actualizaciones...');
      console.log('═'.repeat(70) + '\n');

      for (const update of updates) {
        await dataSource.query(
          `UPDATE songs SET genre = $1 WHERE id = $2`,
          [update.newGenre, update.id]
        );
        console.log(`✅ ${update.artist} - ${update.title} → ${update.newGenre}`);
      }

      console.log('\n' + '═'.repeat(70));
      console.log('✅ ACTUALIZACIÓN COMPLETADA');
      console.log('═'.repeat(70));
      console.log(`   Total actualizado: ${updates.length} canciones`);
    }

    if (notFound.length > 0) {
      console.log('\n' + '═'.repeat(70));
      console.log('⚠️  CANCIONES QUE AÚN NECESITAN CATEGORIZACIÓN MANUAL:');
      console.log('═'.repeat(70) + '\n');

      // Agrupar por artista
      const byArtist = {};
      notFound.forEach(s => {
        if (!byArtist[s.artist]) byArtist[s.artist] = [];
        byArtist[s.artist].push(s);
      });

      for (const [artist, songs] of Object.entries(byArtist)) {
        console.log(`\n${artist} (${songs.length}):`);
        songs.forEach(s => {
          console.log(`   - ${s.title}`);
        });
      }
    }

    await dataSource.destroy();
    console.log('\n✅ Proceso completado\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

reclassifyByArtist();
