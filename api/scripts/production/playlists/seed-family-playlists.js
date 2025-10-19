/**
 * Script para generar playlists automáticas por FAMILIA de géneros
 *
 * Crea 14 playlists (una por familia) con 30 canciones aleatorias de los géneros de esa familia
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

// Cargar familias
const familiesPath = path.join(__dirname, '../../data/genre-families.json');
const families = JSON.parse(fs.readFileSync(familiesPath, 'utf-8'));

// Nombres amigables para las familias
const familyNames = {
  metal: 'Metal',
  rock: 'Rock',
  cumbia: 'Cumbia',
  latin: 'Latin Hits',
  urban: 'Urbano',
  electronic: 'Electronic',
  pop: 'Pop',
  punk: 'Punk',
  folk: 'Folk',
  latin_traditional: 'Regional Mexicano',
  afro_caribbean: 'Afro & Caribbean',
  soul_funk: 'Soul & Funk',
  alternative: 'Alternative',
  chill: 'Chill'
};

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DB_SSL ? {
      rejectUnauthorized: false // Necesario para Railway
    } : false
  });

  try {
    await client.connect();
    console.log('✅ Conectado a Railway PostgreSQL\n');

    let created = 0;
    let skipped = 0;

    // Primero, ELIMINAR todas las playlists públicas antiguas
    console.log('🗑️  Eliminando playlists antiguas...');
    const deleteResult = await client.query(`
      DELETE FROM playlists
      WHERE "userId" IS NULL
        AND "isPublic" = true
    `);
    console.log(`✅ Eliminadas ${deleteResult.rowCount} playlists antiguas\n`);

    for (const [familyKey, genres] of Object.entries(families)) {
      const familyName = familyNames[familyKey];
      console.log(`\n🎵 Procesando familia: ${familyName}`);
      console.log(`   Géneros incluidos: ${genres.join(', ')}`);

      // Crear placeholders para la consulta SQL ($1, $2, $3, ...)
      const placeholders = genres.map((_, index) => `$${index + 1}`).join(', ');

      // Buscar 30 canciones aleatorias de cualquiera de los géneros de esta familia
      const songsResult = await client.query(`
        SELECT id, title, artist, genre
        FROM songs
        WHERE genre IN (${placeholders})
          AND "cloudinaryUrl" IS NOT NULL
        ORDER BY RANDOM()
        LIMIT 30
      `, genres);

      const songs = songsResult.rows;

      if (songs.length === 0) {
        console.log(`  ⚠️  No hay canciones para la familia "${familyName}" - Saltando`);
        skipped++;
        continue;
      }

      console.log(`  ✅ Encontradas ${songs.length} canciones`);

      // Crear nueva playlist
      const createResult = await client.query(`
        INSERT INTO playlists (name, description, genre, "isPublic", "userId", "songCount", "totalDuration")
        VALUES ($1, $2, $3, true, NULL, 0, 0)
        RETURNING id
      `, [
        familyName,
        `Playlist de ${familyName} con las mejores canciones`,
        familyKey // Guardar el key de la familia como "género"
      ]);

      const playlistId = createResult.rows[0].id;
      console.log(`  ✨ Playlist creada: ${playlistId}`);
      created++;

      // Agregar las canciones a la playlist
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
    console.log(`   ⚠️  Familias sin canciones: ${skipped}`);
    console.log(`   📋 Total procesado: ${created + skipped}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
