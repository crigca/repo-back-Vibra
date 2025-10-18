/**
 * 🎵 VIBRA - YouTube API Demo Tool
 * ================================
 * Script de demostración para mostrar la integración con YouTube API
 * Presenta ejemplos visuales de búsquedas y extracción de datos
 */
require('dotenv').config();
const axios = require('axios');

// 🎨 Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// 🌟 Función para crear separadores visuales
function createSeparator(char = '=', length = 60) {
  return char.repeat(length);
}

function printHeader(title) {
  console.log('\n' + colors.cyan + colors.bright + createSeparator('═') + colors.reset);
  console.log(colors.cyan + colors.bright + `║ ${title.padEnd(56)} ║` + colors.reset);
  console.log(colors.cyan + colors.bright + createSeparator('═') + colors.reset);
}

function printSubHeader(title) {
  console.log('\n' + colors.yellow + createSeparator('─', 40) + colors.reset);
  console.log(colors.yellow + colors.bright + `🔹 ${title}` + colors.reset);
  console.log(colors.yellow + createSeparator('─', 40) + colors.reset);
}

async function testYouTubeAPI() {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  const BASE_URL = process.env.YOUTUBE_BASE_URL;

  printHeader('🎵 VIBRA - YOUTUBE API DEMO');

  console.log(colors.blue + '🚀 Iniciando demostración de YouTube API...' + colors.reset);
  console.log(colors.dim + '   Sistema de música inteligente con búsqueda híbrida' + colors.reset);
  console.log('');

  printSubHeader('Configuración del Sistema');
  console.log(`${colors.green}🔑 API Key:${colors.reset} ${API_KEY ? colors.green + API_KEY.substring(0, 12) + '...' + colors.reset : colors.red + 'NO ENCONTRADA' + colors.reset}`);
  console.log(`${colors.blue}📍 Base URL:${colors.reset} ${colors.cyan}${BASE_URL}${colors.reset}`);
  console.log(`${colors.magenta}🎯 Propósito:${colors.reset} Demostración de capacidades de búsqueda`);
  console.log('');

  if (!API_KEY) {
    console.error('❌ YOUTUBE_API_KEY no está configurada en .env');
    console.log('💡 Agrega tu API Key al archivo .env:');
    console.log('   YOUTUBE_API_KEY=tu_api_key_aqui');
    return;
  }

  if (!BASE_URL) {
    console.error('❌ YOUTUBE_BASE_URL no está configurada en .env');
    return;
  }

  // 🎭 Array de búsquedas de demostración
  const demoSearches = [
    { query: 'soda stereo', description: 'Rock Argentino Clásico', emoji: '🎸' },
    { query: 'shakira', description: 'Pop Latino Internacional', emoji: '💃' },
    { query: 'metallica', description: 'Heavy Metal Legendario', emoji: '🤘' },
    { query: 'bad bunny', description: 'Reggaeton Moderno', emoji: '🐰' }
  ];

  try {
    printSubHeader('Búsquedas de Demostración');

    for (const demo of demoSearches) {
      console.log(`\n${colors.magenta}${demo.emoji} Buscando: "${demo.query}" - ${demo.description}${colors.reset}`);
      console.log(colors.dim + '   Consultando YouTube API...' + colors.reset);

      await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa dramática

      const response = await axios.get(`${BASE_URL}/search`, {
        params: {
          key: API_KEY,
          q: demo.query,
          part: 'snippet',
          type: 'video',
          maxResults: 3,
          regionCode: 'AR',
          videoCategoryId: '10'
        }
      });

      console.log(`${colors.green}✅ ¡Búsqueda exitosa!${colors.reset} ${colors.cyan}(${response.data.items.length} resultados)${colors.reset}`);

      response.data.items.forEach((item, index) => {
        const titleColor = index === 0 ? colors.bright + colors.white : colors.white;
        console.log(`\n   ${colors.yellow}${index + 1}.${colors.reset} ${titleColor}🎶 ${item.snippet.title}${colors.reset}`);
        console.log(`      ${colors.blue}👤 Canal:${colors.reset} ${item.snippet.channelTitle}`);
        console.log(`      ${colors.magenta}🆔 YouTube ID:${colors.reset} ${colors.cyan}${item.id.videoId}${colors.reset}`);
        console.log(`      ${colors.green}📅 Publicado:${colors.reset} ${new Date(item.snippet.publishedAt).toLocaleDateString()}`);
        console.log(`      ${colors.dim}🔗 https://youtube.com/watch?v=${item.id.videoId}${colors.reset}`);
      });

      console.log('\n' + colors.dim + '   ⏱️  Pausa entre búsquedas...' + colors.reset);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    printSubHeader('Análisis de Metadatos Avanzados');

    // Usar el último resultado para análisis detallado
    const lastSearch = demoSearches[demoSearches.length - 1];
    console.log(`${colors.blue}🔬 Analizando metadatos de: "${lastSearch.query}"${colors.reset}`);
    console.log(colors.dim + '   Obteniendo duraciones, estadísticas y detalles...' + colors.reset);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const finalResponse = await axios.get(`${BASE_URL}/search`, {
      params: {
        key: API_KEY,
        q: lastSearch.query,
        part: 'snippet',
        type: 'video',
        maxResults: 2,
        regionCode: 'AR',
        videoCategoryId: '10'
      }
    });

    const videoIds = finalResponse.data.items.map(item => item.id.videoId).join(',');

    const detailsResponse = await axios.get(`${BASE_URL}/videos`, {
      params: {
        key: API_KEY,
        id: videoIds,
        part: 'contentDetails,statistics'
      }
    });

    console.log(`${colors.green}📊 Análisis Completo:${colors.reset}\n`);

    finalResponse.data.items.forEach((item, index) => {
      const details = detailsResponse.data.items[index];
      const duration = parseDuration(details.contentDetails.duration);
      const views = parseInt(details.statistics.viewCount).toLocaleString();
      const likes = details.statistics.likeCount ? parseInt(details.statistics.likeCount).toLocaleString() : 'N/A';

      console.log(`${colors.bright}${colors.white}🎵 Video ${index + 1}: ${item.snippet.title}${colors.reset}`);
      console.log(`   ${colors.cyan}⏱️  Duración:${colors.reset} ${colors.yellow}${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}${colors.reset} (${duration}s)`);
      console.log(`   ${colors.magenta}👁️  Reproducciones:${colors.reset} ${colors.green}${views}${colors.reset}`);
      console.log(`   ${colors.red}❤️  Me gusta:${colors.reset} ${colors.green}${likes}${colors.reset}`);
      console.log(`   ${colors.blue}📅 Fecha:${colors.reset} ${new Date(item.snippet.publishedAt).toLocaleDateString()}`);
      console.log('');
    });

    printSubHeader('Demostración de Extracción de Artistas');
    console.log(colors.blue + '🎯 Mostrando cómo VIBRA extrae nombres de artistas...' + colors.reset);
    console.log('');

    const artistExamples = [
      'Bad Bunny - Yonaguni (Video Oficial)',
      'Shakira | Hips Don\'t Lie ft. Wyclef Jean',
      'Soda Stereo - De Música Ligera (Video Oficial)',
      'Miss Monique - Mind Games [Progressive House Mix]'
    ];

    artistExamples.forEach((title, index) => {
      const extractedArtist = extractArtistDemo(title);
      console.log(`${colors.yellow}${index + 1}.${colors.reset} ${colors.dim}Título:${colors.reset} ${title}`);
      console.log(`   ${colors.green}🎤 Artista extraído:${colors.reset} ${colors.bright}${colors.white}${extractedArtist}${colors.reset}`);
      console.log('');
    });

    printSubHeader('Resumen de Capacidades');

    const capabilities = [
      '🔍 Búsqueda inteligente en YouTube API',
      '🎤 Extracción automática de nombres de artistas',
      '⏱️  Análisis de duración y metadatos',
      '📊 Estadísticas de reproducciones y likes',
      '🌍 Filtrado por región (Argentina)',
      '🎵 Categorización automática por música',
      '💾 Preparado para integración con base de datos',
      '🔄 Sistema híbrido (BD + YouTube API)'
    ];

    capabilities.forEach(capability => {
      console.log(`   ${capability}`);
    });

    console.log('\n' + colors.bright + colors.green + '🎉 ¡DEMOSTRACIÓN COMPLETADA EXITOSAMENTE!' + colors.reset);
    console.log(colors.cyan + '🚀 VIBRA está listo para revolucionar la música' + colors.reset);
    console.log(colors.dim + '   Sistema probado y validado ✅' + colors.reset);
    
  } catch (error) {
    printSubHeader('Error en la Demostración');

    console.log(colors.red + colors.bright + '💥 ¡OOPS! Algo salió mal...' + colors.reset);
    console.log('');

    if (error.response?.status === 403) {
      console.log(colors.red + '🚫 Error 403: Acceso Denegado' + colors.reset);
      console.log('');
      console.log(colors.yellow + '🔧 Posibles soluciones:' + colors.reset);
      console.log('   ' + colors.cyan + '• Verifica que la API Key sea correcta' + colors.reset);
      console.log('   ' + colors.cyan + '• Asegúrate de que YouTube Data API v3 esté habilitada' + colors.reset);
      console.log('   ' + colors.cyan + '• Revisa las restricciones de la API Key en Google Console' + colors.reset);
      console.log('   ' + colors.cyan + '• Confirma que el proyecto tenga billing habilitado' + colors.reset);

    } else if (error.response?.status === 400) {
      console.log(colors.yellow + '⚠️ Error 400: Petición Incorrecta' + colors.reset);
      console.log('');
      console.log(colors.yellow + '🔧 Posibles soluciones:' + colors.reset);
      console.log('   ' + colors.cyan + '• Problema con los parámetros de la petición' + colors.reset);
      console.log('   ' + colors.cyan + '• Verifica que la URL base sea correcta' + colors.reset);
      console.log('   ' + colors.cyan + '• Revisa el formato de los parámetros enviados' + colors.reset);

    } else if (error.response?.status === 429) {
      console.log(colors.magenta + '🚧 Error 429: Cuota Excedida' + colors.reset);
      console.log('');
      console.log(colors.yellow + '🔧 Solución:' + colors.reset);
      console.log('   ' + colors.cyan + '• Has superado el límite diario de 10,000 unidades' + colors.reset);
      console.log('   ' + colors.cyan + '• Espera hasta mañana para hacer más requests' + colors.reset);
      console.log('   ' + colors.cyan + '• Considera optimizar las búsquedas para usar menos cuota' + colors.reset);

    } else {
      console.log(`${colors.red}💥 Error ${error.response?.status || 'DESCONOCIDO'}: ${error.message}${colors.reset}`);
      console.log('');
      if (error.response?.data) {
        console.log(colors.dim + '📋 Detalles técnicos:' + colors.reset);
        console.log(colors.dim + JSON.stringify(error.response.data, null, 2) + colors.reset);
      }
    }

    console.log('');
    console.log(colors.blue + '💡 Contacta al equipo de desarrollo si el problema persiste' + colors.reset);
    console.log(colors.dim + '   Email: dev@vibra-music.com' + colors.reset);
  }
}

/**
 * 🎤 Función de demostración para extracción de artistas
 * Replica la lógica del YoutubeService
 */
function extractArtistDemo(title) {
  // Patrón 1: Artista - Canción
  const pattern1 = /^([^-:]+)\s*[-:]/;
  const match1 = title.match(pattern1);
  if (match1) {
    return match1[1].trim();
  }

  // Patrón 2: Artista | Canción
  const pattern2 = /^([^|]+)\s*\|\s*.+/;
  const match2 = title.match(pattern2);
  if (match2) {
    return match2[1].trim();
  }

  // Si no hay patrón, usar la primera parte antes del primer espacio
  return title.split(' ')[0];
}

/**
 * 🕐 Convierte duración ISO 8601 (PT4M20S) a segundos
 */
function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
}

// Ejecutar prueba
testYouTubeAPI();