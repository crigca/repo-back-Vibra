const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración
const API_BASE_URL = 'http://localhost:3000';
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'audio');

// Estadísticas
let stats = {
  totalMp3Files: 0,
  orphanFiles: 0,
  deleted: 0,
  errors: 0,
  spaceFreed: 0
};

/**
 * Obtener todos los archivos MP3 del disco
 */
function getAllMP3Files() {
  console.log('📁 Leyendo archivos MP3 del disco...\n');

  if (!fs.existsSync(AUDIO_DIR)) {
    console.error(`❌ Error: No existe el directorio ${AUDIO_DIR}`);
    return [];
  }

  const files = fs.readdirSync(AUDIO_DIR);
  const mp3Files = files.filter(file => file.endsWith('.mp3'));

  console.log(`✅ Encontrados ${mp3Files.length} archivos MP3\n`);
  stats.totalMp3Files = mp3Files.length;

  return mp3Files;
}

/**
 * Extraer youtubeId del nombre del archivo
 */
function extractYoutubeId(filename) {
  return filename.replace('.mp3', '');
}

/**
 * Buscar canción en la DB por youtubeId
 */
async function findSongByYoutubeId(youtubeId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/music/songs/all-raw`, {
      params: { limit: 10000 }
    });

    const song = response.data.find(s => s.youtubeId === youtubeId);
    return song || null;

  } catch (error) {
    console.error(`❌ Error buscando canción con youtubeId ${youtubeId}:`, error.message);
    return null;
  }
}

/**
 * Eliminar archivo MP3
 */
function deleteMP3File(filename) {
  const filePath = path.join(AUDIO_DIR, filename);

  try {
    // Obtener tamaño del archivo antes de eliminar
    const stats_file = fs.statSync(filePath);
    const fileSizeMB = (stats_file.size / (1024 * 1024)).toFixed(2);

    // Eliminar archivo
    fs.unlinkSync(filePath);

    console.log(`🗑️  Eliminado: ${filename} (${fileSizeMB} MB)`);
    stats.deleted++;
    stats.spaceFreed += stats_file.size;

    return true;
  } catch (error) {
    console.error(`❌ Error eliminando ${filename}:`, error.message);
    stats.errors++;
    return false;
  }
}

/**
 * Función principal
 */
async function cleanupOrphanMP3() {
  console.log('🧹 LIMPIEZA DE ARCHIVOS MP3 HUÉRFANOS');
  console.log('=====================================');
  console.log('Este script eliminará archivos MP3 que NO tienen registro en la base de datos.\n');

  // 1. Obtener archivos MP3 del disco
  const mp3Files = getAllMP3Files();

  if (mp3Files.length === 0) {
    console.log('❌ No hay archivos MP3 para procesar.');
    return;
  }

  console.log('🔍 Buscando archivos huérfanos...\n');
  console.log('═'.repeat(60));
  console.log('');

  // 2. Procesar cada archivo MP3
  const orphanFiles = [];

  for (let i = 0; i < mp3Files.length; i++) {
    const filename = mp3Files[i];
    const youtubeId = extractYoutubeId(filename);

    // Mostrar progreso
    if ((i + 1) % 100 === 0) {
      console.log(`\n--- Progreso: ${i + 1}/${mp3Files.length} archivos verificados ---\n`);
    }

    // Buscar canción en la DB
    const song = await findSongByYoutubeId(youtubeId);

    if (!song) {
      orphanFiles.push(filename);
      stats.orphanFiles++;
    }

    // Pausa pequeña para no saturar la API
    await new Promise(resolve => setTimeout(resolve, 30));
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('');
  console.log(`📋 Encontrados ${orphanFiles.length} archivos huérfanos\n`);

  if (orphanFiles.length === 0) {
    console.log('✅ No hay archivos huérfanos para eliminar.');
    return;
  }

  // 3. Eliminar archivos huérfanos
  console.log('🗑️  Eliminando archivos huérfanos...\n');

  for (const filename of orphanFiles) {
    deleteMP3File(filename);

    // Pausa pequeña
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Resumen final
  console.log('');
  console.log('═'.repeat(60));
  console.log('');
  console.log('📊 RESUMEN FINAL');
  console.log('================');
  console.log(`Total archivos MP3 analizados: ${stats.totalMp3Files}`);
  console.log(`Archivos huérfanos encontrados: ${stats.orphanFiles}`);
  console.log(`Archivos eliminados: ${stats.deleted}`);
  console.log(`Errores: ${stats.errors}`);
  console.log(`Espacio liberado: ${(stats.spaceFreed / (1024 * 1024)).toFixed(2)} MB`);
  console.log('');

  if (stats.deleted > 0) {
    console.log(`✅ Limpieza completada! ${stats.deleted} archivos eliminados.`);
  } else {
    console.log('⚠️  No se pudo eliminar ningún archivo.');
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
  if (serverRunning) {
    await cleanupOrphanMP3();
  }
}

main().catch(console.error);
