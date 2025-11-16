const { DataSource } = require('typeorm');
const axios = require('axios');
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

// Función para esperar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchArtist(artistName) {
  try {
    const response = await axios.get(`http://localhost:3000/music/search`, {
      params: { query: artistName }
    });

    return response.data;
  } catch (error) {
    console.error(`   ❌ Error buscando "${artistName}":`, error.message);
    return null;
  }
}

async function autoSearchMissingArtists() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a Railway PostgreSQL\n');

    // Obtener todos los géneros tier1 y tier2
    const tier1Genres = genresTiers.tier1.genres;
    const tier2Genres = genresTiers.tier2.genres;
    const allTierGenres = [...tier1Genres, ...tier2Genres];

    const artistsWithZeroSongs = [];

    console.log('🔍 Buscando artistas con 0 canciones...\n');

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

        if (songCount === 0) {
          artistsWithZeroSongs.push({ artist, genre, tier });
        }
      }
    }

    console.log(`📊 Encontrados ${artistsWithZeroSongs.length} artistas con 0 canciones\n`);
    console.log('================================================================================');
    console.log('🤖 INICIANDO BÚSQUEDA AUTOMÁTICA');
    console.log('================================================================================\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < artistsWithZeroSongs.length; i++) {
      const { artist, genre, tier } = artistsWithZeroSongs[i];

      console.log(`\n[${i + 1}/${artistsWithZeroSongs.length}] Buscando: "${artist}" (${genre} - ${tier})`);

      const results = await searchArtist(artist);

      if (results) {
        console.log(`   ✅ Búsqueda completada - ${results.length || 0} resultados encontrados`);
        successCount++;
      } else {
        console.log(`   ❌ Error en la búsqueda`);
        errorCount++;
      }

      // Esperar 5 segundos antes de la siguiente búsqueda
      if (i < artistsWithZeroSongs.length - 1) {
        console.log(`   ⏳ Esperando 5 segundos...`);
        await sleep(5000);
      }
    }

    console.log('\n\n================================================================================');
    console.log('📊 RESUMEN FINAL');
    console.log('================================================================================');
    console.log(`Total artistas buscados: ${artistsWithZeroSongs.length}`);
    console.log(`✅ Búsquedas exitosas: ${successCount}`);
    console.log(`❌ Búsquedas con error: ${errorCount}`);
    console.log('================================================================================\n');

    await AppDataSource.destroy();
    console.log('✅ Proceso completado - Conexión cerrada');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

autoSearchMissingArtists();
