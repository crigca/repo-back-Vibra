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

async function checkTier1Tier2Artists() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a Railway PostgreSQL\n');

    // Obtener todos los géneros tier1 y tier2
    const tier1Genres = genresTiers.tier1.genres;
    const tier2Genres = genresTiers.tier2.genres;
    const allTierGenres = [...tier1Genres, ...tier2Genres];

    console.log(`📊 Analizando ${tier1Genres.length} géneros TIER 1 y ${tier2Genres.length} géneros TIER 2\n`);
    console.log('='.repeat(80) + '\n');

    const results = {
      tier1: [],
      tier2: []
    };

    // Para cada género en tier1 y tier2
    for (const genre of allTierGenres) {
      const tier = tier1Genres.includes(genre) ? 'tier1' : 'tier2';
      const artistsInGenre = artistsByGenre[genre] || [];

      console.log(`\n🎵 ${genre.toUpperCase()} (${tier.toUpperCase()}) - ${artistsInGenre.length} artistas registrados`);
      console.log('-'.repeat(80));

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

          if (songCount === 0) {
            console.log(`  ❌ ${artist}: ${songCount} canciones`);
          } else {
            console.log(`  ⚠️  ${artist}: ${songCount} canciones`);
          }
        }
      }
    }

    // Resumen final
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 RESUMEN FINAL - ARTISTAS CON MENOS DE 10 CANCIONES');
    console.log('='.repeat(80) + '\n');

    console.log(`🔥 TIER 1 (${tier1Genres.length} géneros):`);
    console.log(`   Total artistas con <10 canciones: ${results.tier1.length}\n`);

    if (results.tier1.length > 0) {
      results.tier1.sort((a, b) => a.songCount - b.songCount);
      results.tier1.forEach(item => {
        console.log(`   ${item.songCount === 0 ? '❌' : '⚠️ '} ${item.artist} (${item.genre}): ${item.songCount} canciones`);
      });
    }

    console.log(`\n\n🔥 TIER 2 (${tier2Genres.length} géneros):`);
    console.log(`   Total artistas con <10 canciones: ${results.tier2.length}\n`);

    if (results.tier2.length > 0) {
      results.tier2.sort((a, b) => a.songCount - b.songCount);
      results.tier2.forEach(item => {
        console.log(`   ${item.songCount === 0 ? '❌' : '⚠️ '} ${item.artist} (${item.genre}): ${item.songCount} canciones`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Total artistas analizados en Tier 1+2: ${allTierGenres.reduce((sum, g) => sum + (artistsByGenre[g] || []).length, 0)}`);
    console.log(`⚠️  Total con menos de 10 canciones: ${results.tier1.length + results.tier2.length}\n`);

    await AppDataSource.destroy();
    console.log('✅ Conexión cerrada');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkTier1Tier2Artists();
