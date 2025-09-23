/**
 * Script para probar que la YouTube API Key funciona correctamente
 * Busca videos de "Soda Stereo" y muestra los resultados
 */
require('dotenv').config(); // Cargar variables del .env
const axios = require('axios');

async function testYouTubeAPI() {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  const BASE_URL = process.env.YOUTUBE_BASE_URL;
  
  console.log('🔍 Probando YouTube API...');
  console.log(`🔑 API Key: ${API_KEY ? API_KEY.substring(0, 10) + '...' : 'NO ENCONTRADA'}`);
  console.log(`📍 Base URL: ${BASE_URL}`);
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

  try {
    console.log('🎸 Buscando videos de "Soda Stereo"...');
    
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        key: API_KEY,
        q: 'soda stereo',
        part: 'snippet',
        type: 'video',
        maxResults: 5,
        regionCode: 'AR',
        videoCategoryId: '10' // Categoría Música
      }
    });
    
    console.log('✅ ¡API Key funciona correctamente!');
    console.log(`📊 Encontrados ${response.data.items.length} videos`);
    console.log('🎵 Resultados:');
    console.log('');
    
    response.data.items.forEach((item, index) => {
      console.log(`${index + 1}. 🎶 ${item.snippet.title}`);
      console.log(`   👤 Canal: ${item.snippet.channelTitle}`);
      console.log(`   🆔 YouTube ID: ${item.id.videoId}`);
      console.log(`   📅 Publicado: ${new Date(item.snippet.publishedAt).toLocaleDateString()}`);
      console.log(`   🔗 URL: https://www.youtube.com/watch?v=${item.id.videoId}`);
      console.log('');
    });
    
    // Obtener detalles adicionales de duración
    console.log('🕐 Obteniendo duraciones...');
    const videoIds = response.data.items.map(item => item.id.videoId).join(',');
    
    const detailsResponse = await axios.get(`${BASE_URL}/videos`, {
      params: {
        key: API_KEY,
        id: videoIds,
        part: 'contentDetails,statistics'
      }
    });
    
    console.log('📋 Detalles adicionales:');
    detailsResponse.data.items.forEach((video, index) => {
      const duration = parseDuration(video.contentDetails.duration);
      const views = parseInt(video.statistics.viewCount).toLocaleString();
      console.log(`${index + 1}. Duración: ${duration}s | Vistas: ${views}`);
    });
    
    console.log('');
    console.log('🎉 ¡Prueba exitosa! La API está lista para usar en VIBRA');
    console.log('🚀 Siguiente paso: Crear DTOs y servicios');
    
  } catch (error) {
    console.log('❌ Error al probar API:');
    console.log('');
    
    if (error.response?.status === 403) {
      console.log('🚫 Error 403: Forbidden');
      console.log('   - Verifica que la API Key sea correcta');
      console.log('   - Asegúrate de que YouTube Data API v3 esté habilitada');
      console.log('   - Revisa las restricciones de la API Key');
    } else if (error.response?.status === 400) {
      console.log('⚠️ Error 400: Bad Request');
      console.log('   - Problema con los parámetros de la petición');
      console.log('   - Verifica que la URL base sea correcta');
    } else if (error.response?.status === 429) {
      console.log('🚧 Error 429: Quota Exceeded');
      console.log('   - Has superado el límite de requests');
      console.log('   - Espera unos minutos e intenta de nuevo');
    } else {
      console.log(`💥 Error ${error.response?.status || 'UNKNOWN'}: ${error.message}`);
      if (error.response?.data) {
        console.log('📋 Detalles:', error.response.data);
      }
    }
  }
}

/**
 * Convierte duración ISO 8601 (PT4M20S) a segundos
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