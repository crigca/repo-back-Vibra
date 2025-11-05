const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3000';

// Cargar géneros válidos desde genres.json
const validGenresPath = path.join(__dirname, '../../data/genres.json');
const validGenres = JSON.parse(fs.readFileSync(validGenresPath, 'utf8'));

// Mapa de normalización: variaciones incorrectas → género correcto
const genreNormalizationMap = {
  // Rock variations
  'Rock Argentino': 'RockArgentino',
  'Rock Latino': 'RockLatino',
  'rock': 'Rock',
  'rockArgentino': 'RockArgentino',

  // Pop variations
  'pop': 'Pop',
  'Pop Latino Clasico': 'PopLatinoClasico',
  'Pop Punk': 'PopPunk',

  // R&B variations
  'R&B': 'Rb',
  'rb': 'Rb',

  // Soft Rock variations
  'Soft Rock': 'SoftRock',
  'softRock': 'SoftRock',

  // Cumbia variations
  'cumbia': 'Cumbia',

  // Clasica variations
  'clasica': 'Clasica',

  // Géneros que ya no existen - moverlos a sus equivalentes
  'Alternative': 'AlternativeRock',
  'Electronic': 'EdmActual',
  'Latin': 'PopLatinoActual',
  'Metal': 'HeavyMetal',
  'Hip-Hop': 'Hiphop',
  'Regional Mexicano': 'Norteño',

  // Indie/Folk/Jazz variations (lowercase)
  'folk': 'Folk',
  'indieRock': 'IndieRock',
  'jazz': 'Jazz',
  'latinIndie': 'LatinIndie',

  // Urbano (ya existe en genres.json como UrbanoLatino)
  'Urbano': 'UrbanoLatino',

  // Otros casos
  'Sin categoría': 'Sin categoría', // Mantener como está
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function normalizeGenres() {
  console.log('\n🔧 NORMALIZACIÓN DE GÉNEROS EN LA BASE DE DATOS');
  console.log('======================================================================');
  console.log('Este script normalizará todos los géneros según genres.json');
  console.log('======================================================================\n');

  try {
    // Verificar conexión con el servidor
    await axios.get(`${API_BASE_URL}/music/songs/all-raw`);
    console.log('✅ Servidor conectado\n');
  } catch (error) {
    console.error('❌ Error: No se puede conectar al servidor');
    console.error('   Asegúrate de que el servidor esté corriendo en el puerto 3000\n');
    process.exit(1);
  }

  try {
    // Obtener todas las canciones
    console.log('🔍 Obteniendo todas las canciones...\n');
    const response = await axios.get(`${API_BASE_URL}/music/songs/all-raw`);
    const allSongs = response.data;

    console.log(`📊 Total de canciones: ${allSongs.length}\n`);

    // Analizar géneros únicos en la DB
    const genresInDB = new Set();
    allSongs.forEach(song => {
      if (song.genre) {
        genresInDB.add(song.genre);
      }
    });

    console.log('📋 Géneros únicos encontrados en la DB:');
    const sortedGenres = Array.from(genresInDB).sort();
    sortedGenres.forEach(genre => {
      const isValid = validGenres.includes(genre);
      const needsNormalization = genreNormalizationMap[genre];

      if (!isValid) {
        if (needsNormalization) {
          console.log(`   ⚠️  "${genre}" → se normalizará a "${needsNormalization}"`);
        } else {
          console.log(`   ❌ "${genre}" → NO ESTÁ EN EL MAPA DE NORMALIZACIÓN`);
        }
      } else {
        console.log(`   ✅ "${genre}" → correcto`);
      }
    });

    console.log('\n======================================================================');
    console.log('⏳ Esperando 5 segundos antes de comenzar la normalización...\n');
    await sleep(5000);

    // Filtrar canciones que necesitan normalización
    const songsToNormalize = allSongs.filter(song => {
      return song.genre && genreNormalizationMap[song.genre];
    });

    if (songsToNormalize.length === 0) {
      console.log('✅ No hay canciones que normalizar\n');
      return;
    }

    console.log(`🎯 Normalizando ${songsToNormalize.length} canciones...\n`);
    console.log('======================================================================\n');

    let normalizedCount = 0;
    let errorCount = 0;
    const normalizedByGenre = {};

    for (let i = 0; i < songsToNormalize.length; i++) {
      const song = songsToNormalize[i];
      const oldGenre = song.genre;
      const newGenre = genreNormalizationMap[oldGenre];

      console.log(`[${i + 1}/${songsToNormalize.length}] Procesando:`);
      console.log(`   Título: "${song.title}"`);
      console.log(`   Artista: "${song.artist}"`);
      console.log(`   "${oldGenre}" → "${newGenre}"`);

      try {
        await axios.patch(`${API_BASE_URL}/music/songs/${song.id}`, {
          genre: newGenre
        });

        normalizedCount++;
        normalizedByGenre[oldGenre] = (normalizedByGenre[oldGenre] || 0) + 1;
        console.log(`   ✅ Normalizado\n`);
      } catch (error) {
        errorCount++;
        console.log(`   ❌ Error al normalizar\n`);
      }

      // Pequeña pausa entre requests
      await sleep(100);
    }

    // Resumen final
    console.log('======================================================================');
    console.log('📊 RESUMEN FINAL');
    console.log('======================================================================');
    console.log(`Total canciones procesadas: ${songsToNormalize.length}`);
    console.log(`✅ Normalizadas: ${normalizedCount}`);
    console.log(`❌ Errores: ${errorCount}\n`);

    console.log('📈 Normalizaciones por género:');
    Object.entries(normalizedByGenre).forEach(([oldGenre, count]) => {
      const newGenre = genreNormalizationMap[oldGenre];
      console.log(`   "${oldGenre}" → "${newGenre}": ${count} canciones`);
    });
    console.log('======================================================================\n');

  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

normalizeGenres();
