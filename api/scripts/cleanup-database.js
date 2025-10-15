const axios = require('axios');

// Configuración
const API_BASE_URL = 'http://localhost:3000';

// Lista de palabras prohibidas (misma que en seed-music.js)
// OBJETIVO: Solo canciones oficiales de calidad
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

// Función para verificar si una canción debe ser eliminada
function shouldDelete(song) {
  // FILTRO 1: Duración (entre 60 y 600 segundos = 1-10 minutos)
  if (!song.duration || song.duration < 60 || song.duration > 600) {
    return { delete: true, reason: `duración inválida (${song.duration}s)` };
  }

  // FILTRO 2: YouTube ID válido
  if (!song.youtubeId) {
    return { delete: true, reason: 'sin youtubeId' };
  }

  // FILTRO 3: Palabras prohibidas en el título
  if (hasBannedWords(song.title)) {
    return { delete: true, reason: 'título prohibido (mix/compilation/best of)' };
  }

  // FILTRO 4: Mínimo 1000 vistas (igual que seed-music.js)
  if (!song.viewCount || song.viewCount < 1000) {
    return { delete: true, reason: `pocas vistas (${song.viewCount || 0})` };
  }

  return { delete: false };
}

// Estadísticas
let stats = {
  total: 0,
  analyzed: 0,
  deleted: 0,
  kept: 0,
  errors: 0,
  reasons: {
    duration: 0,
    noYoutubeId: 0,
    bannedTitle: 0,
    lowViews: 0
  }
};

// Función para obtener todas las canciones
async function getAllSongs() {
  try {
    console.log('📋 Obteniendo todas las canciones de la base de datos...\n');

    const totalResponse = await axios.get(`${API_BASE_URL}/music/songs/count`);
    stats.total = totalResponse.data.total; // Extraer el número del objeto { total: number }

    console.log(`Total de canciones en DB: ${stats.total}\n`);

    // Obtener todas las canciones (en lotes de 500)
    let allSongs = [];
    let offset = 0;
    const limit = 500;

    while (offset < stats.total) {
      const response = await axios.get(`${API_BASE_URL}/music/songs/all-raw`, {
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

    // Contar razones
    if (reason.includes('duración')) stats.reasons.duration++;
    else if (reason.includes('youtubeId')) stats.reasons.noYoutubeId++;
    else if (reason.includes('título')) stats.reasons.bannedTitle++;
    else if (reason.includes('vistas')) stats.reasons.lowViews++;

    return true;

  } catch (error) {
    console.error(`❌ Error eliminando "${song.title}":`, error.message);
    stats.errors++;
    return false;
  }
}

// Función principal
async function cleanupDatabase() {
  console.log('🧹 LIMPIEZA DE BASE DE DATOS');
  console.log('============================');
  console.log('Este script eliminará canciones que NO cumplan con:');
  console.log('  ✓ Duración entre 60-600 segundos (1-10 minutos)');
  console.log('  ✓ youtubeId válido');
  console.log('  ✓ Título sin palabras prohibidas (mix, best of, compilation, etc.)');
  console.log('  ✓ Mínimo 1000 vistas en YouTube');
  console.log('');

  // Obtener todas las canciones
  const songs = await getAllSongs();

  if (songs.length === 0) {
    console.log('❌ No se pudieron cargar canciones. Verifica que el servidor esté corriendo.');
    return;
  }

  console.log('🔍 Analizando canciones...\n');
  console.log('═'.repeat(60));
  console.log('');

  // Analizar y eliminar canciones inválidas
  for (const song of songs) {
    stats.analyzed++;

    const check = shouldDelete(song);

    if (check.delete) {
      await deleteSong(song, check.reason);

      // Pausa pequeña para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 50));
    } else {
      stats.kept++;
    }

    // Mostrar progreso cada 50 canciones
    if (stats.analyzed % 50 === 0) {
      console.log(`\n--- Progreso: ${stats.analyzed}/${songs.length} analizadas ---\n`);
    }
  }

  // Resumen final
  console.log('');
  console.log('═'.repeat(60));
  console.log('');
  console.log('📊 RESUMEN FINAL');
  console.log('================');
  console.log(`Total de canciones analizadas: ${stats.analyzed}`);
  console.log(`Canciones eliminadas: ${stats.deleted}`);
  console.log(`Canciones conservadas: ${stats.kept}`);
  console.log(`Errores: ${stats.errors}`);
  console.log('');
  console.log('📋 Razones de eliminación:');
  console.log(`  • Duración inválida: ${stats.reasons.duration}`);
  console.log(`  • Sin youtubeId: ${stats.reasons.noYoutubeId}`);
  console.log(`  • Título prohibido: ${stats.reasons.bannedTitle}`);
  console.log(`  • Pocas vistas (< 1000): ${stats.reasons.lowViews}`);
  console.log('');

  if (stats.deleted > 0) {
    const percentage = ((stats.deleted / stats.total) * 100).toFixed(1);
    console.log(`✅ Limpieza completada! Se eliminó el ${percentage}% de la base de datos.`);
    console.log(`Base de datos optimizada: ${stats.kept} canciones válidas restantes.`);
  } else {
    console.log('✅ Base de datos limpia! No se encontraron canciones inválidas.');
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

// Ejecutar script con confirmación
async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    return;
  }

  console.log('⚠️  ADVERTENCIA: Este script eliminará canciones de la base de datos.');
  console.log('⚠️  Asegúrate de tener un backup si es necesario.\n');

  // En producción deberías usar readline para confirmar
  // Por ahora ejecuta directamente
  await cleanupDatabase();
}

main().catch(console.error);
