const axios = require('axios');

// Configuración
const API_BASE_URL = 'http://localhost:3000';

// Estadísticas
let stats = {
  total: 0,
  analyzed: 0,
  valid: 0,
  invalid: 0,
  deleted: 0,
  errors: 0,
  invalidReasons: {
    videoDeleted: 0,
    videoPrivate: 0,
    videoUnavailable: 0,
    ageRestricted: 0,
    other: 0
  }
};

// Función para verificar si un YouTube ID es válido
async function validateYouTubeId(youtubeId) {
  try {
    // Intentar hacer una petición HEAD al video de YouTube
    const response = await axios.head(`https://www.youtube.com/watch?v=${youtubeId}`, {
      timeout: 5000,
      maxRedirects: 5
    });

    // Si la respuesta es 200, el video existe y es accesible
    return { valid: true, status: response.status };

  } catch (error) {
    // Si hay error, el video probablemente no existe o no es accesible
    if (error.response) {
      return {
        valid: false,
        status: error.response.status,
        reason: error.response.status === 404 ? 'Video eliminado' : `Status ${error.response.status}`
      };
    } else {
      return {
        valid: false,
        status: null,
        reason: 'No accesible'
      };
    }
  }
}

// Función alternativa: Verificar usando oEmbed de YouTube
async function validateWithOEmbed(youtubeId) {
  try {
    const response = await axios.get(`https://www.youtube.com/oembed`, {
      params: {
        url: `https://www.youtube.com/watch?v=${youtubeId}`,
        format: 'json'
      },
      timeout: 5000
    });

    // Si oEmbed responde, el video existe y se puede embeber
    return { valid: true, embedable: true };

  } catch (error) {
    if (error.response?.status === 404) {
      return { valid: false, reason: 'Video no encontrado o no se puede embeber' };
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      return { valid: false, reason: 'Video privado o restringido' };
    } else {
      return { valid: false, reason: 'Error al verificar' };
    }
  }
}

// Función para obtener todas las canciones
async function getAllSongs() {
  try {
    console.log('📋 Obteniendo todas las canciones de la base de datos...\n');

    const totalResponse = await axios.get(`${API_BASE_URL}/music/songs/count`);
    stats.total = totalResponse.data.total;

    console.log(`Total de canciones en DB: ${stats.total}\n`);

    // Obtener todas las canciones (en lotes de 500)
    let allSongs = [];
    let offset = 0;
    const limit = 500;

    while (offset < stats.total) {
      const response = await axios.get(`${API_BASE_URL}/music/songs`, {
        params: { limit, offset }
      });

      allSongs = allSongs.concat(response.data);
      offset += limit;
      console.log(`Cargadas ${allSongs.length}/${stats.total} canciones...`);
    }

    console.log(`\n✅ Total cargadas: ${allSongs.length} canciones\n`);
    return allSongs;

  } catch (error) {
    console.error('❌ Error obteniendo canciones:', error.message);
    return [];
  }
}

// Función para eliminar una canción
async function deleteSong(song, reason) {
  try {
    await axios.delete(`${API_BASE_URL}/music/songs/${song.id}`);

    console.log(`🗑️  Eliminada: "${song.title}" (${reason})`);
    stats.deleted++;
    return true;

  } catch (error) {
    console.error(`❌ Error eliminando "${song.title}":`, error.message);
    stats.errors++;
    return false;
  }
}

// Función principal
async function validateDatabase(autoDelete = false) {
  console.log('🔍 VALIDACIÓN DE YOUTUBE IDs');
  console.log('============================');
  console.log('Este script verificará si los YouTube IDs son válidos');
  console.log(`Auto-eliminar videos inválidos: ${autoDelete ? 'SÍ' : 'NO'}`);
  console.log('');

  // Obtener todas las canciones
  const songs = await getAllSongs();

  if (songs.length === 0) {
    console.log('❌ No se pudieron cargar canciones. Verifica que el servidor esté corriendo.');
    return;
  }

  console.log('🔍 Validando YouTube IDs...');
  console.log('⏳ Esto puede tomar varios minutos...\n');
  console.log('═'.repeat(80));
  console.log('');

  // Analizar canciones
  for (const song of songs) {
    stats.analyzed++;

    // Validar usando oEmbed (más confiable para saber si se puede embeber)
    const validation = await validateWithOEmbed(song.youtubeId);

    if (validation.valid) {
      stats.valid++;
      console.log(`✅ [${stats.analyzed}/${songs.length}] "${song.title}" - YouTube ID válido`);
    } else {
      stats.invalid++;
      console.log(`❌ [${stats.analyzed}/${songs.length}] "${song.title}"`);
      console.log(`   YouTube ID: ${song.youtubeId}`);
      console.log(`   Razón: ${validation.reason}`);
      console.log(`   URL: https://www.youtube.com/watch?v=${song.youtubeId}`);

      // Categorizar razón
      if (validation.reason.includes('no encontrado')) {
        stats.invalidReasons.videoDeleted++;
      } else if (validation.reason.includes('privado')) {
        stats.invalidReasons.videoPrivate++;
      } else if (validation.reason.includes('restringido')) {
        stats.invalidReasons.ageRestricted++;
      } else {
        stats.invalidReasons.other++;
      }

      // Auto-eliminar si está habilitado
      if (autoDelete) {
        await deleteSong(song, validation.reason);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('');
    }

    // Pausa para no saturar YouTube
    await new Promise(resolve => setTimeout(resolve, 200));

    // Mostrar progreso cada 20 canciones
    if (stats.analyzed % 20 === 0) {
      console.log(`\n--- Progreso: ${stats.analyzed}/${songs.length} (${((stats.analyzed / songs.length) * 100).toFixed(1)}%) ---`);
      console.log(`Válidas: ${stats.valid} | Inválidas: ${stats.invalid}\n`);
    }
  }

  // Resumen final
  console.log('');
  console.log('═'.repeat(80));
  console.log('');
  console.log('📊 RESUMEN FINAL');
  console.log('================');
  console.log(`Total de canciones analizadas: ${stats.analyzed}`);
  console.log(`YouTube IDs válidos: ${stats.valid} (${((stats.valid / stats.total) * 100).toFixed(1)}%)`);
  console.log(`YouTube IDs inválidos: ${stats.invalid} (${((stats.invalid / stats.total) * 100).toFixed(1)}%)`);

  if (autoDelete) {
    console.log(`Canciones eliminadas: ${stats.deleted}`);
  }

  console.log('');
  console.log('📋 Razones de invalidez:');
  console.log(`  • Videos eliminados/no encontrados: ${stats.invalidReasons.videoDeleted}`);
  console.log(`  • Videos privados: ${stats.invalidReasons.videoPrivate}`);
  console.log(`  • Videos con restricción de edad: ${stats.invalidReasons.ageRestricted}`);
  console.log(`  • Otros: ${stats.invalidReasons.other}`);
  console.log('');

  if (stats.invalid > 0 && !autoDelete) {
    console.log('💡 Para eliminar automáticamente los videos inválidos, ejecuta:');
    console.log('   npm run validate:youtube -- --delete');
  }

  console.log('');
}

// Verificar que el servidor esté corriendo
async function checkServer() {
  try {
    await axios.get(`${API_BASE_URL}/music/songs/count`);
    console.log('✅ Servidor conectado\n');
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
  if (!serverRunning) {
    return;
  }

  // Verificar si se pasó el flag --delete
  const autoDelete = process.argv.includes('--delete');

  if (autoDelete) {
    console.log('⚠️  MODO ELIMINACIÓN AUTOMÁTICA ACTIVADO');
    console.log('⚠️  Los videos inválidos serán eliminados de la base de datos.\n');
  }

  await validateDatabase(autoDelete);
}

main().catch(console.error);
