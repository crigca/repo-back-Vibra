const axios = require('axios');
const { artistsByGenre, genericQueries } = require('./artists-data');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');

// Configuración
const API_BASE_URL = 'http://localhost:3000';
const TARGET_SONGS = 500;  // Límite seguro para no agotar cuota
const MAX_SEARCHES = 90;   // 80 búsquedas máximo por día
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'audio');

// Generar búsquedas dinámicamente
function generateSearchQueries() {
  const queries = [];

  // Sistema de prioridad: Official Channel > VEVO > Topic
  // Búsquedas optimizadas para canales oficiales y embebibles
  const searchVariations = [
    // PRIORIDAD 1: Canal oficial del artista (verificado)
    { suffix: 'official audio', weight: 5 },
    { suffix: 'official video', weight: 4 },

    // PRIORIDAD 2: VEVO (casi siempre embebible)
    { suffix: 'vevo official', weight: 4 },

    // PRIORIDAD 3: Topic channels (siempre embebible)
    { suffix: 'topic official audio', weight: 5 },
    { suffix: 'topic audio', weight: 3 }
  ];

  Object.entries(artistsByGenre).forEach(([genre, artists]) => {
    artists.forEach(artist => {
      // Selección aleatoria ponderada
      const totalWeight = searchVariations.reduce((sum, v) => sum + v.weight, 0);
      let random = Math.floor(Math.random() * totalWeight);
      let selectedVariation;

      for (const variation of searchVariations) {
        random -= variation.weight;
        if (random < 0) {
          selectedVariation = variation;
          break;
        }
      }

      queries.push({
        query: `${artist} "${selectedVariation.suffix}" -live -cover -karaoke -lyrics -mix -compilation -"best of" -"greatest hits" -playlist -album -"top 10" -"top 20" -remix -nightcore -"sped up" -slowed -instrumental -acoustic`,
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

// Lista de palabras prohibidas en títulos (en varios idiomas)
// OBJETIVO: Solo canciones individuales, NO compilaciones, mixes, tops, etc.
const TITLE_BLACKLIST = [
  // Mix / Mezclas / Remixes
  'mix', 'megamix', 'minimix', 'dj mix', 'remix compilation', 'mixed by',
  'mashup', 'medley', 'mezcla', 'popurri', 'popurrí', 'potpourri',
  'remix', 'remixes', 'remezcla',

  // Top / Mejores
  'top 10', 'top 20', 'top 30', 'top 40', 'top 50', 'top 100',
  'top songs', 'top hits', 'top music', 'top tracks',
  'lo mejor', 'the best', 'best of', 'mejores', 'best songs', 'las mejores',

  // Grandes éxitos / Hits
  'grandes exitos', 'grandes éxitos', 'greatest hits', 'top hits',
  'hits compilation', 'best hits', 'all hits', 'super hits', 'mega hits',
  'éxitos', 'exitos', 'hits collection',

  // Compilaciones / Colecciones
  'compilation', 'compilación', 'compilacion',
  'recopilación', 'recopilacion', 'colección', 'coleccion', 'collection',

  // Álbum completo
  'full album', 'album completo', 'álbum completo', 'complete album',
  'disco completo', 'entire album', 'whole album',

  // Playlist / Listas
  'playlist', 'lista de reproducción', 'lista reproduccion',

  // Números que indican compilaciones
  'top10', 'top20', 'top30', 'top40', 'top50',

  // Horas (videos largos)
  ' hour', ' hours', ' hora', ' horas', ' hr', ' hrs',
  '1 hour', '2 hour', '3 hour', '1 hora', '2 hora', '3 hora',

  // Live/Conciertos
  'live concert', 'concierto completo', 'full concert', 'en vivo completo',
  'live', 'en vivo', 'vivo', 'ao vivo', 'live session', 'live performance',

  // Versiones modificadas / No oficiales
  'cover', 'covers', 'cover version',
  'nightcore',
  'sped up', 'spedup', 'speed up', 'fast version',
  'slowed', 'slowed down', 'reverb', 'slowed + reverb',
  'acoustic version', 'acoustic',
  '8d audio', '8d', '16d',

  // Karaoke/Lyrics/Instrumental
  'karaoke', 'lyrics video', 'letra', 'con letra',
  'instrumental', 'instrumental version',

  // Otros indicadores de compilación
  'all songs', 'todas las canciones', 'all tracks', 'todas sus canciones',
  'discography', 'discografia', 'discografía'
];

// Función para verificar si el título contiene palabras prohibidas
function hasBannedWords(title) {
  const lowerTitle = title.toLowerCase();
  return TITLE_BLACKLIST.some(word => lowerTitle.includes(word));
}

// Función para descargar MP3 de YouTube usando Cobalt API
async function downloadMP3(youtubeId) {
  const url = `https://www.youtube.com/watch?v=${youtubeId}`;
  const outputPath = path.join(AUDIO_DIR, `${youtubeId}.mp3`);

  // Verificar si ya existe
  if (fs.existsSync(outputPath)) {
    console.log(`   ✅ Audio ya existe: ${youtubeId}.mp3`);
    return `audio/${youtubeId}.mp3`;
  }

  console.log(`   ⬇️  Descargando audio con Cobalt...`);

  try {
    // Paso 1: Solicitar URL de descarga a Cobalt API (usando instancia sin auth)
    const cobaltResponse = await axios.post('https://cobalt-api.meowing.de/', {
      url: url,
      audioFormat: 'mp3',
      youtubeBetterAudio: true
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 segundos timeout
    });

    // Verificar respuesta de Cobalt
    if (!cobaltResponse.data || !cobaltResponse.data.url) {
      throw new Error(`Cobalt no devolvió URL de descarga: ${JSON.stringify(cobaltResponse.data)}`);
    }

    const downloadUrl = cobaltResponse.data.url;
    console.log(`   📥 URL obtenida, descargando archivo...`);

    // Paso 2: Descargar el archivo MP3 desde la URL proporcionada
    const audioResponse = await axios.get(downloadUrl, {
      responseType: 'stream',
      timeout: 60000 // 60 segundos para descargar
    });

    // Paso 3: Guardar el archivo
    const writeStream = fs.createWriteStream(outputPath);
    audioResponse.data.pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        console.log(`   ✅ Audio descargado: ${youtubeId}.mp3`);
        resolve(`audio/${youtubeId}.mp3`);
      });

      writeStream.on('error', (error) => {
        console.error(`   ❌ Error escribiendo archivo: ${error.message}`);
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
        reject(error);
      });
    });

  } catch (error) {
    console.error(`   ❌ Error descargando con Cobalt: ${error.message}`);
    if (error.response) {
      console.error(`   Response status: ${error.response.status}`);
      console.error(`   Response data:`, error.response.data);
    }
    // Eliminar archivo incompleto si existe
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    throw error;
  }
}

// Función para guardar canción en BD
async function saveSong(song, genre) {
  try {
    // FILTRO 1: Verificar duración (entre 60 y 600 segundos = 1-10 minutos)
    if (!song.duration || song.duration < 60 || song.duration > 600) {
      console.log(`⏭️ Omitida (duración ${song.duration}s): "${song.title}"`);
      return false;
    }

    // FILTRO 2: Verificar youtubeId válido
    if (!song.id) {
      console.log(`⏭️ Omitida (sin youtubeId): "${song.title}"`);
      return false;
    }

    // FILTRO 3: Verificar palabras prohibidas en el título
    if (hasBannedWords(song.title)) {
      console.log(`⏭️ Omitida (título prohibido): "${song.title}"`);
      return false;
    }

    // FILTRO 4: Mínimo 1000 vistas
    if (!song.viewCount || song.viewCount < 1000) {
      console.log(`⏭️ Omitida (pocas vistas: ${song.viewCount || 0}): "${song.title}"`);
      return false;
    }

    // Guardar en la base de datos SIN audioPath (se descargará después)
    const songData = {
      title: song.title,
      artist: song.artist,
      youtubeId: song.id,
      duration: song.duration,
      viewCount: song.viewCount,
      publishedAt: song.publishedAt,
      genre: genre
      // audioPath: se agregará después con download-mp3.js
    };

    await axios.post(`${API_BASE_URL}/music/songs`, songData);

    console.log(`💾 Guardada: "${song.title}" por ${song.artist} (${song.duration}s)`);
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