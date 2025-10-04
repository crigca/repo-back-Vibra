const axios = require('axios');
const { artistsByGenre, genericQueries } = require('./artists-data');

// Configuración
const API_BASE_URL = 'http://localhost:3000';
const TARGET_SONGS = 400;  // Límite seguro para no agotar cuota
const MAX_SEARCHES = 80;   // 80 búsquedas máximo por día

// Generar búsquedas dinámicamente
function generateSearchQueries() {
  const queries = [];

  // Búsquedas por artista individual (6-8 canciones por artista)
  Object.entries(artistsByGenre).forEach(([genre, artists]) => {
    artists.forEach(artist => {
      queries.push({
        query: artist,
        maxResults: Math.floor(Math.random() * 3) + 6, // 6-8 resultados
        genre: genre.charAt(0).toUpperCase() + genre.slice(1)
      });
    });
  });

  // Agregar búsquedas genéricas
  queries.push(...genericQueries);

  // Mezclar aleatoriamente para variety
  return queries.sort(() => Math.random() - 0.5);
}

const searchQueries = generateSearchQueries();

// Estadísticas
let stats = {
  searched: 0,
  found: 0,
  saved: 0,
  duplicates: 0,
  errors: 0
};

// Función para hacer búsqueda en YouTube
async function searchSongs(query, maxResults) {
  try {
    console.log(`🔍 Buscando: "${query}" (max: ${maxResults})`);

    const response = await axios.get(`${API_BASE_URL}/music/search`, {
      params: { query, maxResults }
    });

    stats.found += response.data.length;
    console.log(`✅ Encontradas ${response.data.length} canciones`);
    return response.data;

  } catch (error) {
    console.error(`❌ Error buscando "${query}":`, error.message);
    stats.errors++;
    return [];
  }
}

// Función para guardar canción en BD
async function saveSong(song, genre) {
  try {
    const songData = {
      title: song.title,
      artist: song.artist,
      youtubeId: song.id,
      duration: song.duration,
      viewCount: song.viewCount,
      publishedAt: song.publishedAt,
      genre: genre
    };

    const response = await axios.post(`${API_BASE_URL}/music/songs`, songData);

    console.log(`💾 Guardada: "${song.title}" por ${song.artist}`);
    stats.saved++;
    return true;

  } catch (error) {
    if (error.response?.status === 409) {
      // Canción duplicada (ya existe)
      console.log(`⚠️ Duplicada: "${song.title}"`);
      stats.duplicates++;
    } else {
      console.error(`❌ Error guardando "${song.title}":`, error.message);
      stats.errors++;
    }
    return false;
  }
}

// Función principal
async function seedMusic() {
  console.log('🎵 INICIANDO PRECARGA DE MÚSICA');
  console.log('=================================');
  console.log(`Meta: ${TARGET_SONGS} canciones`);
  console.log(`Límite de búsquedas: ${MAX_SEARCHES}`);
  console.log('');

  for (const searchQuery of searchQueries) {
    // Control de límite de búsquedas
    if (stats.searched >= MAX_SEARCHES) {
      console.log(`🛑 Límite de búsquedas alcanzado (${MAX_SEARCHES})`);
      console.log('💡 Ejecuta mañana para continuar sin agotar cuota');
      break;
    }

    stats.searched++;

    // Buscar canciones en YouTube
    const songs = await searchSongs(searchQuery.query, searchQuery.maxResults);

    // Guardar cada canción encontrada
    for (const song of songs) {
      await saveSong(song, searchQuery.genre);

      // Pausa pequeña para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('');

    // Si ya tenemos suficientes canciones, parar
    if (stats.saved >= TARGET_SONGS) {
      console.log(`🎯 Meta alcanzada: ${stats.saved} canciones guardadas`);
      break;
    }
  }

  // Resumen final
  console.log('');
  console.log('📊 RESUMEN FINAL');
  console.log('================');
  console.log(`Búsquedas realizadas: ${stats.searched}/${MAX_SEARCHES}`);
  console.log(`Canciones encontradas: ${stats.found}`);
  console.log(`Canciones guardadas: ${stats.saved}/${TARGET_SONGS}`);
  console.log(`Duplicadas (omitidas): ${stats.duplicates}`);
  console.log(`Errores: ${stats.errors}`);
  console.log('');

  if (stats.saved > 0) {
    console.log('✅ Precarga completada exitosamente!');
    if (stats.saved < TARGET_SONGS && stats.searched < MAX_SEARCHES) {
      console.log('💡 Puedes ejecutar de nuevo para agregar más canciones');
    }
  } else {
    console.log('❌ No se pudo guardar ninguna canción');
  }

  console.log('');
  console.log('🔄 Para continuar mañana: npm run seed:music');
}

// Verificar que el servidor esté corriendo
async function checkServer() {
  try {
    await axios.get(`${API_BASE_URL}/music/songs/count`);
    console.log('✅ Servidor conectado');
    return true;
  } catch (error) {
    console.error('❌ Error: El servidor no está corriendo en localhost:3000');
    console.error('💡 Ejecuta: npm run start:dev');
    return false;
  }
}

// Ejecutar script
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await seedMusic();
  }
}

main().catch(console.error);