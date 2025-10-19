const axios = require('axios');
const { artistsByGenre, genericQueries } = require('../../data/artists-data');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');

// Cargar configuración de tiers
const genresTiers = require('../../data/genres-tiers.json');

// Configuración
const API_BASE_URL = 'http://localhost:3000';
const TARGET_SONGS = 500;  // Límite seguro para no agotar cuota
const MAX_SEARCHES = 90;   // 80 búsquedas máximo por día
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'audio');

// Configuración de tiers (Sistema Híbrido - Opción 4 OPTIMIZADO para calidad oficial)
const TIER_CONFIG = {
  tier1: {
    weight: 0.60,           // 60% de las búsquedas
    resultsRange: [10, 15], // 10-15 resultados por artista
    minViews: 15000         // Mínimo 15k vistas (permite oficiales de artistas latinos)
  },
  tier2: {
    weight: 0.25,           // 25% de las búsquedas
    resultsRange: [7, 10],  // 7-10 resultados por artista
    minViews: 8000          // Mínimo 8k vistas
  },
  tier3: {
    weight: 0.12,           // 12% de las búsquedas
    resultsRange: [4, 6],   // 4-6 resultados por artista
    minViews: 2000          // Mínimo 2k vistas
  },
  tier4: {
    weight: 0.03,           // 3% de las búsquedas
    resultsRange: [2, 3],   // 2-3 resultados por artista
    minViews: 1000          // Mínimo 1k vistas
  }
};

// Función helper para encontrar el tier de un género
function getGenreTier(genreName) {
  const normalizedGenre = genreName.toLowerCase().replace(/\s+/g, '');

  for (const [tierKey, tierData] of Object.entries(genresTiers)) {
    const normalizedGenres = tierData.genres.map(g => g.toLowerCase().replace(/\s+/g, ''));
    if (normalizedGenres.includes(normalizedGenre)) {
      return tierKey;
    }
  }

  // Si no se encuentra, asignar tier4 por defecto
  return 'tier4';
}

// Generar búsquedas dinámicamente CON SISTEMA DE TIERS
function generateSearchQueries() {
  const queries = [];

  // Sistema de prioridad: Official Channel > VEVO > Topic
  // Búsquedas optimizadas para canales oficiales y embebibles
  const searchVariations = [
    // PRIORIDAD 1: Videos oficiales (más común y efectivo)
    { suffix: 'official video', weight: 6 },
    { suffix: 'official music video', weight: 5 },

    // PRIORIDAD 2: Audio oficial
    { suffix: 'official audio', weight: 5 },

    // PRIORIDAD 3: VEVO (casi siempre embebible)
    { suffix: 'vevo', weight: 4 },

    // PRIORIDAD 4: Topic channels (siempre embebible)
    { suffix: 'topic', weight: 3 }
  ];

  // Organizar queries por tier
  const queriesByTier = {
    tier1: [],
    tier2: [],
    tier3: [],
    tier4: []
  };

  Object.entries(artistsByGenre).forEach(([genre, artists]) => {
    const tier = getGenreTier(genre);
    const tierConfig = TIER_CONFIG[tier];

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

      // Calcular número de resultados según el rango del tier
      const [min, max] = tierConfig.resultsRange;
      const maxResults = Math.floor(Math.random() * (max - min + 1)) + min;

      queriesByTier[tier].push({
        query: `${artist} "${selectedVariation.suffix}" -karaoke -lyrics -"full album"`,
        maxResults: maxResults,
        genre: genre.charAt(0).toUpperCase() + genre.slice(1),
        tier: tier,
        minViews: tierConfig.minViews
      });
    });
  });

  // Mezclar cada tier por separado
  Object.keys(queriesByTier).forEach(tier => {
    queriesByTier[tier].sort(() => Math.random() - 0.5);
  });

  // Calcular cuántas búsquedas por tier según los weights
  const totalSearches = MAX_SEARCHES;
  const searchesByTier = {
    tier1: Math.floor(totalSearches * TIER_CONFIG.tier1.weight),
    tier2: Math.floor(totalSearches * TIER_CONFIG.tier2.weight),
    tier3: Math.floor(totalSearches * TIER_CONFIG.tier3.weight),
    tier4: Math.floor(totalSearches * TIER_CONFIG.tier4.weight)
  };

  // Combinar queries respetando las proporciones de cada tier
  const finalQueries = [
    ...queriesByTier.tier1.slice(0, searchesByTier.tier1),
    ...queriesByTier.tier2.slice(0, searchesByTier.tier2),
    ...queriesByTier.tier3.slice(0, searchesByTier.tier3),
    ...queriesByTier.tier4.slice(0, searchesByTier.tier4)
  ];

  // Agregar búsquedas genéricas (tratarlas como tier1 para prioridad)
  const genericWithTier = genericQueries.map(q => ({
    ...q,
    tier: 'tier1',
    minViews: TIER_CONFIG.tier1.minViews
  }));

  queries.push(...finalQueries);
  queries.push(...genericWithTier);

  // Mezclar aleatoriamente para variety manteniendo balance de tiers
  return queries.sort(() => Math.random() - 0.5);
}

const searchQueries = generateSearchQueries();

// Estadísticas
let stats = {
  searched: 0,
  found: 0,
  saved: 0,
  duplicates: 0,
  errors: 0,
  byTier: {
    tier1: { searched: 0, saved: 0 },
    tier2: { searched: 0, saved: 0 },
    tier3: { searched: 0, saved: 0 },
    tier4: { searched: 0, saved: 0 }
  }
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
async function saveSong(song, genre, minViews = 1000, tier = 'tier4') {
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

    // FILTRO 4: Mínimo de vistas dinámico según tier
    if (!song.viewCount || song.viewCount < minViews) {
      console.log(`⏭️ Omitida (pocas vistas: ${song.viewCount || 0}, mínimo: ${minViews}): "${song.title}"`);
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

    console.log(`💾 Guardada: "${song.title}" por ${song.artist} (${song.duration}s, ${song.viewCount?.toLocaleString()} vistas)`);
    stats.saved++;
    stats.byTier[tier].saved++;
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
  console.log('🎵 INICIANDO PRECARGA DE MÚSICA CON SISTEMA DE TIERS');
  console.log('====================================================');
  console.log(`Meta: ${TARGET_SONGS} canciones`);
  console.log(`Límite de búsquedas: ${MAX_SEARCHES}`);
  console.log('');
  console.log('⚙️  CONFIGURACIÓN DE TIERS (Optimizado para Contenido Oficial):');
  console.log('----------------------------------------------------------------');
  console.log('TIER 1 (Mainstream): 60% búsquedas, 10-15 resultados/artista, min 15k vistas');
  console.log('TIER 2 (Muy Popular): 25% búsquedas, 7-10 resultados/artista, min 8k vistas');
  console.log('TIER 3 (Dedicado): 12% búsquedas, 4-6 resultados/artista, min 2k vistas');
  console.log('TIER 4 (Nicho): 3% búsquedas, 2-3 resultados/artista, min 1k vistas');
  console.log('');
  console.log('🎯 Filtros de Calidad: Solo contenido oficial (no lives, covers, karaoke)');
  console.log('');

  for (const searchQuery of searchQueries) {
    // Control de límite de búsquedas
    if (stats.searched >= MAX_SEARCHES) {
      console.log(`🛑 Límite de búsquedas alcanzado (${MAX_SEARCHES})`);
      console.log('💡 Ejecuta mañana para continuar sin agotar cuota');
      break;
    }

    stats.searched++;

    // Registrar búsqueda por tier
    if (searchQuery.tier && stats.byTier[searchQuery.tier]) {
      stats.byTier[searchQuery.tier].searched++;
    }

    // Mostrar información del tier actual
    console.log(`📊 Tier: ${searchQuery.tier?.toUpperCase() || 'N/A'} | Min vistas: ${searchQuery.minViews?.toLocaleString() || 'N/A'}`);

    // Buscar canciones en YouTube
    const songs = await searchSongs(searchQuery.query, searchQuery.maxResults);

    // Guardar cada canción encontrada con filtro de vistas dinámico
    for (const song of songs) {
      await saveSong(song, searchQuery.genre, searchQuery.minViews || 1000, searchQuery.tier || 'tier4');

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

  // Estadísticas por tier
  console.log('📈 DISTRIBUCIÓN POR TIER (Sistema Híbrido)');
  console.log('==========================================');
  Object.entries(stats.byTier).forEach(([tier, data]) => {
    const tierConfig = TIER_CONFIG[tier];
    const percentage = stats.saved > 0 ? ((data.saved / stats.saved) * 100).toFixed(1) : 0;
    console.log(`${tier.toUpperCase()}:`);
    console.log(`  Búsquedas: ${data.searched} (objetivo: ${tierConfig.weight * 100}%)`);
    console.log(`  Guardadas: ${data.saved} (${percentage}% del total)`);
    console.log(`  Min vistas: ${tierConfig.minViews.toLocaleString()}`);
    console.log(`  Resultados: ${tierConfig.resultsRange[0]}-${tierConfig.resultsRange[1]} por artista`);
    console.log('');
  });

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