/**
 * Script para generar playlists automáticas por género
 *
 * Crea una playlist por cada género con 24 canciones aleatorias
 * Las playlists se ordenan según genres-tiers.json
 */

const path = require('path');
const fs = require('fs');

// Cargar .env desde la raíz del proyecto API
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const { Client } = require('pg');

// Configuración de Railway
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;
const DB_SSL = process.env.DB_SSL === 'true';

if (!DB_HOST || !DB_PORT || !DB_USERNAME || !DB_PASSWORD || !DB_NAME) {
  console.error('❌ Faltan variables de BD en .env');
  process.exit(1);
}

const DATABASE_URL = `postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}${DB_SSL ? '?sslmode=require' : ''}`;

console.log('🔗 Conectando a:', `postgresql://${DB_USERNAME}:***@${DB_HOST}:${DB_PORT}/${DB_NAME}`);

// Cargar tiers
const tiersPath = path.join(__dirname, '../../data/genres-tiers.json');
const tiers = JSON.parse(fs.readFileSync(tiersPath, 'utf-8'));

// Obtener todos los géneros ordenados por tier
function getAllGenresOrderedByTier() {
  const genresList = [];

  // Tier 1
  genresList.push(...shuffleArray([...tiers.tier1.genres]));
  // Tier 2
  genresList.push(...shuffleArray([...tiers.tier2.genres]));
  // Tier 3
  genresList.push(...shuffleArray([...tiers.tier3.genres]));
  // Tier 4
  genresList.push(...shuffleArray([...tiers.tier4.genres]));

  return genresList;
}

// Función para mezclar array (Fisher-Yates shuffle)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DB_SSL ? {
      rejectUnauthorized: false // Necesario para Railway
    } : false
  });

  try {
    await client.connect();
    console.log('✅ Conectado a Railway PostgreSQL');

    // Obtener géneros ordenados por tier (aleatorios dentro de cada tier)
    const genres = getAllGenresOrderedByTier();
    console.log(`📋 Total de géneros: ${genres.length}`);
    console.log(`🎵 Géneros: ${genres.join(', ')}`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const genre of genres) {
      console.log(`\n🎵 Procesando género: ${genre}`);

      // Buscar 24 canciones aleatorias de este género
      const songsResult = await client.query(`
        SELECT id, title, artist
        FROM songs
        WHERE genre = $1
          AND "cloudinaryUrl" IS NOT NULL
        ORDER BY RANDOM()
        LIMIT 24
      `, [genre]);

      const songs = songsResult.rows;

      if (songs.length === 0) {
        console.log(`  ⚠️  No hay canciones para género "${genre}" - Saltando`);
        skipped++;
        continue;
      }

      console.log(`  ✅ Encontradas ${songs.length} canciones`);

      // Verificar si ya existe una playlist para este género
      const existingResult = await client.query(`
        SELECT id, "songCount"
        FROM playlists
        WHERE name = $1
          AND "userId" IS NULL
          AND "isPublic" = true
      `, [genre]);

      let playlistId;

      if (existingResult.rows.length > 0) {
        // Actualizar playlist existente
        playlistId = existingResult.rows[0].id;
        console.log(`  🔄 Actualizando playlist existente: ${playlistId}`);

        // Actualizar el campo genre si no existe
        await client.query(`
          UPDATE playlists
          SET genre = $1
          WHERE id = $2
        `, [genre, playlistId]);

        // Eliminar canciones anteriores
        await client.query(`
          DELETE FROM playlist_songs
          WHERE "playlistId" = $1
        `, [playlistId]);

        updated++;
      } else {
        // Crear nueva playlist
        const createResult = await client.query(`
          INSERT INTO playlists (name, description, genre, "isPublic", "userId", "songCount", "totalDuration")
          VALUES ($1, $2, $3, true, NULL, 0, 0)
          RETURNING id
        `, [
          genre,
          `Playlist automática de ${genre} con 24 canciones seleccionadas aleatoriamente`,
          genre
        ]);

        playlistId = createResult.rows[0].id;
        console.log(`  ✨ Playlist creada: ${playlistId}`);
        created++;
      }

      // Agregar las 24 canciones a la playlist
      let totalDuration = 0;
      for (let i = 0; i < songs.length; i++) {
        const song = songs[i];

        await client.query(`
          INSERT INTO playlist_songs ("playlistId", "songId", position, "addedAt")
          VALUES ($1, $2, $3, NOW())
        `, [playlistId, song.id, i]);

        // Obtener duración de la canción
        const durationResult = await client.query(`
          SELECT duration FROM songs WHERE id = $1
        `, [song.id]);

        totalDuration += durationResult.rows[0]?.duration || 0;
      }

      // Actualizar songCount y totalDuration
      await client.query(`
        UPDATE playlists
        SET "songCount" = $1, "totalDuration" = $2, "updatedAt" = NOW()
        WHERE id = $3
      `, [songs.length, totalDuration, playlistId]);

      console.log(`  ✅ ${songs.length} canciones agregadas (${Math.floor(totalDuration / 60)} minutos)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ PROCESO COMPLETADO');
    console.log('='.repeat(60));
    console.log(`📊 Resumen:`);
    console.log(`   ✨ Playlists creadas: ${created}`);
    console.log(`   🔄 Playlists actualizadas: ${updated}`);
    console.log(`   ⚠️  Géneros sin canciones: ${skipped}`);
    console.log(`   📋 Total procesado: ${created + updated + skipped}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
