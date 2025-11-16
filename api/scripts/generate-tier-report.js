const { DataSource } = require('typeorm');
require('dotenv').config();

const { artistsByGenre } = require('./data/artists-data.js');
const genresTiers = require('./data/genres-tiers.json');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: false,
  entities: [],
});

// Normalización de strings
function normalizeForSearch(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

async function generateTierReport() {
  try {
    await AppDataSource.initialize();

    // Obtener todos los géneros tier1 y tier2
    const tier1Genres = genresTiers.tier1.genres;
    const tier2Genres = genresTiers.tier2.genres;
    const allTierGenres = [...tier1Genres, ...tier2Genres];

    const results = {
      tier1: [],
      tier2: []
    };

    // Para cada género en tier1 y tier2
    for (const genre of allTierGenres) {
      const tier = tier1Genres.includes(genre) ? 'tier1' : 'tier2';
      const artistsInGenre = artistsByGenre[genre] || [];

      // Para cada artista en este género
      for (const artist of artistsInGenre) {
        const normalizedArtist = normalizeForSearch(artist);

        // Contar canciones en la BD
        const count = await AppDataSource.query(
          `SELECT COUNT(*) as count FROM songs
           WHERE REGEXP_REPLACE(LOWER(REGEXP_REPLACE(artist, '[^a-zA-Z0-9 ]', '', 'g')), '[^a-z0-9]', '', 'g')
           LIKE '%' || $1 || '%'`,
          [normalizedArtist]
        );

        const songCount = parseInt(count[0].count);

        if (songCount < 10) {
          const entry = { artist, genre, songCount };
          results[tier].push(entry);
        }
      }
    }

    // Ordenar y mostrar solo resumen final
    console.log('================================================================================');
    console.log('📊 ARTISTAS TIER 1 Y TIER 2 CON MENOS DE 10 CANCIONES');
    console.log('================================================================================\n');

    // TIER 1
    console.log(`\n🔥 TIER 1 - Total: ${results.tier1.length} artistas\n`);
    results.tier1.sort((a, b) => a.songCount - b.songCount);

    results.tier1.forEach(item => {
      console.log(`${item.songCount === 0 ? '❌' : '⚠️ '} ${item.artist.padEnd(40)} (${item.genre.padEnd(20)}) ${item.songCount} canciones`);
    });

    // TIER 2
    console.log(`\n\n🔥 TIER 2 - Total: ${results.tier2.length} artistas\n`);
    results.tier2.sort((a, b) => a.songCount - b.songCount);

    results.tier2.forEach(item => {
      console.log(`${item.songCount === 0 ? '❌' : '⚠️ '} ${item.artist.padEnd(40)} (${item.genre.padEnd(20)}) ${item.songCount} canciones`);
    });

    console.log('\n================================================================================');
    console.log(`TOTAL ARTISTAS CON <10 CANCIONES: ${results.tier1.length + results.tier2.length}`);
    console.log('================================================================================\n');

    await AppDataSource.destroy();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateTierReport();
