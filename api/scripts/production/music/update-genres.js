#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════
 * SCRIPT DE ACTUALIZACIÓN AUTOMÁTICA DE GÉNEROS MUSICALES
 * ═══════════════════════════════════════════════════════════════════════
 *
 * PROPÓSITO:
 * ---------
 * Este script actualiza automáticamente el campo 'genre' de las canciones
 * que están marcadas como 'Sin categoría' en la base de datos.
 *
 * PROBLEMA QUE RESUELVE:
 * ---------------------
 * Cuando las canciones se auto-guardan desde YouTube en el sistema, si no
 * se detecta el género del artista, quedan marcadas como 'Sin categoría'.
 * Esto causa que:
 * - El script de Cloudinary no sepa en qué carpeta subirlas
 * - Las playlists automáticas no las incluyan correctamente
 * - La organización de la música sea deficiente
 *
 * CÓMO FUNCIONA:
 * -------------
 * 1. Carga una base de datos de ~1000+ artistas organizados por género
 *    desde el archivo 'artists-data.js'
 *
 * 2. Busca en la BD todas las canciones con genre = 'Sin categoría'
 *
 * 3. Para cada canción:
 *    a) Normaliza el nombre del artista (minúsculas, sin acentos)
 *    b) Busca el artista en la base de datos de géneros
 *    c) Si lo encuentra, actualiza el género en la BD
 *    d) Si no lo encuentra, lo deja como 'Sin categoría' para
 *       categorización manual posterior
 *
 * 4. Muestra un resumen de cuántas canciones se actualizaron
 *
 * MÉTODOS DE DETECCIÓN:
 * --------------------
 * - Búsqueda exacta por nombre de artista
 * - Búsqueda parcial (ej: "Metallica feat. James" → encuentra "Metallica")
 * - Detección por palabras clave en el título (fallback)
 *
 * USO:
 * ----
 * npm run update:genres
 *
 * CUÁNDO EJECUTARLO:
 * -----------------
 * - Después de agregar nuevas canciones desde YouTube
 * - Antes de ejecutar el script de descarga/subida a Cloudinary
 * - Cuando actualices la lista de artistas en artists-data.js
 *
 * NOTA IMPORTANTE:
 * ---------------
 * Las canciones que queden con 'Sin categoría' después de ejecutar
 * este script son aquellas cuyos artistas NO están en la base de datos
 * de artists-data.js. Estas deberán categorizarse manualmente o agregando
 * el artista a la lista correspondiente.
 *
 * ═══════════════════════════════════════════════════════════════════════
 */

const { DataSource } = require('typeorm');
const path = require('path');

// Cargar variables de entorno desde .env
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Cargar la base de datos de artistas organizados por género
// Este archivo contiene ~1000+ artistas mapeados a sus géneros musicales
const { artistsByGenre } = require('../../data/artists-data.js');

// Crear mapa artista -> género
const artistGenreMap = new Map();

// Normalizar string (minúsculas, sin acentos)
function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9\s]/g, '') // Eliminar caracteres especiales
    .trim();
}

// Capitalizar género
function capitalizeGenre(genre) {
  const withSpaces = genre.replace(/([A-Z])/g, ' $1').trim();
  return withSpaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Mapa de normalización de géneros
const genreNormalizationMap = new Map([
  ['rock', 'Rock'],
  ['rockargentino', 'Rock Argentino'],
  ['rocklatino', 'Rock Latino'],
  ['alternativerock', 'Alternative'],
  ['indierock', 'Alternative'],
  ['metal', 'Metal'],
  ['heavymetal', 'Metal'],
  ['heavymetalargentino', 'Metal'],
  ['thrashmetal', 'Metal'],
  ['deathmetal', 'Metal'],
  ['blackmetal', 'Metal'],
  ['pop', 'Pop'],
  ['poplatinoactual', 'Latin'],
  ['poplatinoClasico', 'Latin'],
  ['edm', 'Electronic'],
  ['edmactual', 'Electronic'],
  ['house', 'Electronic'],
  ['techno', 'Electronic'],
  ['reggaeton', 'Reggaeton'],
  ['trap', 'Urbano'],
  ['trapargentino', 'Urbano'],
  ['urbanolatino', 'Urbano'],
  ['hiphop', 'Hip-Hop'],
  ['rap', 'Hip-Hop'],
  ['cumbia', 'Cumbia'],
  ['cumbia420', 'Cumbia'],
  ['cumbiavillera', 'Cumbia'],
  ['salsa', 'Salsa'],
  ['merengue', 'Latin'],
  ['bachata', 'Latin'],
  ['norteño', 'Regional Mexicano'],
  ['corrido', 'Regional Mexicano'],
  ['corridostumbados', 'Regional Mexicano'],
  ['mariachi', 'Regional Mexicano'],
  ['ranchera', 'Regional Mexicano'],
  ['balada', 'Balada'],
  ['tango', 'Tango'],
  ['cuarteto', 'Cuarteto'],
  ['jazz', 'Jazz'],
  ['soul', 'Soul'],
  ['funk', 'Funk'],
  ['reggae', 'Reggae'],
  ['punk', 'Punk'],
  ['country', 'Country'],
  ['folk', 'Folk'],
]);

// Cargar datos de artistas
function loadArtistData() {
  for (const [genre, artists] of Object.entries(artistsByGenre)) {
    for (const artist of artists) {
      const normalizedArtist = normalizeString(artist);
      artistGenreMap.set(normalizedArtist, genre);
    }
  }
  console.log(`📚 Cargados ${artistGenreMap.size} artistas con géneros asociados`);
}

// Detectar género de una canción
function detectGenre(artist, title) {
  const normalizedArtist = normalizeString(artist);

  // 1. Buscar por artista exacto
  const genreKey = artistGenreMap.get(normalizedArtist);
  if (genreKey) {
    const mappedGenre = genreNormalizationMap.get(genreKey.toLowerCase());
    return mappedGenre || capitalizeGenre(genreKey);
  }

  // 2. Buscar por coincidencia parcial
  for (const [artistKey, genreKey] of artistGenreMap.entries()) {
    if (normalizedArtist.includes(artistKey) || artistKey.includes(normalizedArtist)) {
      const mappedGenre = genreNormalizationMap.get(genreKey.toLowerCase());
      return mappedGenre || capitalizeGenre(genreKey);
    }
  }

  // 3. No se pudo detectar
  return null;
}

// Configuración de Railway
const railwayConfig = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

async function main() {
  console.log('\n🎵 ACTUALIZACIÓN DE GÉNEROS DE CANCIONES');
  console.log('=========================================\n');

  // Cargar datos de artistas
  loadArtistData();

  // Conectar a Railway
  console.log('🔌 Conectando a Railway PostgreSQL...');
  console.log(`   Host: ${railwayConfig.host}:${railwayConfig.port}`);
  console.log(`   Database: ${railwayConfig.database}`);
  console.log(`   User: ${railwayConfig.username}`);

  const dataSource = new DataSource(railwayConfig);

  try {
    await dataSource.initialize();
    console.log('✅ Conectado a Railway\n');
  } catch (error) {
    console.error('❌ Error al conectar a Railway:', error.message);
    console.error('   Verifica las variables de entorno en el archivo .env');
    process.exit(1);
  }

  try {
    // Obtener todas las canciones con 'Sin categoría'
    console.log('📋 Buscando canciones con "Sin categoría"...');

    const songs = await dataSource.query(
      'SELECT id, title, artist, genre FROM songs WHERE genre = $1',
      ['Sin categoría']
    );

    console.log(`🎯 Encontradas ${songs.length} canciones para actualizar\n`);

    if (songs.length === 0) {
      console.log('✅ No hay canciones para actualizar');
      await dataSource.destroy();
      return;
    }

    let updated = 0;
    let skipped = 0;

    // Actualizar cada canción
    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      const progress = `[${i + 1}/${songs.length}]`;

      console.log(`${progress} "${song.title}" - ${song.artist}`);
      console.log(`   Género actual: ${song.genre}`);

      // Detectar nuevo género
      const detectedGenre = detectGenre(song.artist, song.title);

      if (detectedGenre && detectedGenre !== 'Sin categoría') {
        // Actualizar género
        await dataSource.query(
          'UPDATE songs SET genre = $1 WHERE id = $2',
          [detectedGenre, song.id]
        );
        console.log(`   ✅ Actualizado a: ${detectedGenre}\n`);
        updated++;
      } else {
        console.log(`   ⏭️  No se pudo detectar género (se mantiene "Sin categoría")\n`);
        skipped++;
      }
    }

    console.log('\n📊 RESUMEN');
    console.log('==========');
    console.log(`✅ Actualizadas: ${updated} canciones`);
    console.log(`⏭️  Sin cambios: ${skipped} canciones`);
    console.log(`📝 Total procesadas: ${songs.length} canciones`);

  } catch (error) {
    console.error('\n❌ Error durante la actualización:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('\n✅ Desconectado de Railway');
  }
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
