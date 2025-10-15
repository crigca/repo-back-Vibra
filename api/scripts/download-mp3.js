const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

// Configuración
const API_BASE_URL = 'http://localhost:3000';
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'audio');
const LIMIT_PER_RUN = 500; // Descargar 500 canciones por ejecución

// Estadísticas
let stats = {
  total: 0,
  downloaded: 0,
  skipped: 0,
  errors: 0
};

/**
 * Descargar MP3 usando yt-dlp
 */
async function downloadMP3(youtubeId) {
  const url = `https://www.youtube.com/watch?v=${youtubeId}`;
  const outputPath = path.join(AUDIO_DIR, `${youtubeId}.mp3`);

  // Verificar si ya existe
  if (fs.existsSync(outputPath)) {
    console.log(`   ✅ Ya existe: ${youtubeId}.mp3`);
    return `audio/${youtubeId}.mp3`;
  }

  console.log(`   ⬇️  Descargando con yt-dlp...`);

  try {
    // Rutas completas a las herramientas
    const ytdlpPath = '/home/crigca/yt-dlp';
    const ffmpegPath = '/home/crigca/ffmpeg-master-latest-linux64-gpl/bin/ffmpeg';

    // Comando yt-dlp para extraer solo audio en MP3
    const command = `${ytdlpPath} -x --audio-format mp3 --audio-quality 0 --ffmpeg-location "${ffmpegPath}" -o "${outputPath}" "${url}"`;

    await execAsync(command, {
      timeout: 120000 // 2 minutos timeout
    });

    if (fs.existsSync(outputPath)) {
      console.log(`   ✅ Descargado: ${youtubeId}.mp3`);
      return `audio/${youtubeId}.mp3`;
    } else {
      throw new Error('Archivo no se creó');
    }
  } catch (error) {
    console.error(`   ❌ Error descargando: ${error.message}`);
    // Limpiar archivo incompleto si existe
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    throw error;
  }
}

/**
 * Actualizar audioPath en la base de datos
 */
async function updateSongAudioPath(songId, audioPath) {
  try {
    await axios.patch(`${API_BASE_URL}/music/songs/${songId}`, {
      audioPath: audioPath
    });
    console.log(`   📝 DB actualizada con audioPath`);
  } catch (error) {
    console.error(`   ❌ Error actualizando DB: ${error.message}`);
    throw error;
  }
}

/**
 * Obtener canciones sin audioPath de la base de datos
 */
async function getSongsWithoutAudio(limit) {
  try {
    // Usar el endpoint específico para canciones sin audio
    const response = await axios.get(`${API_BASE_URL}/music/songs/without-audio`, {
      params: { limit: limit }
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo canciones:', error.message);
    return [];
  }
}

/**
 * Procesar descarga de canciones
 */
async function downloadSongs() {
  console.log('🎵 INICIANDO DESCARGA DE MP3');
  console.log('============================');
  console.log(`Límite por ejecución: ${LIMIT_PER_RUN} canciones`);
  console.log('');

  // Obtener canciones sin audio
  console.log('📋 Obteniendo canciones sin audio...');
  const songs = await getSongsWithoutAudio(LIMIT_PER_RUN);
  stats.total = songs.length;

  if (songs.length === 0) {
    console.log('✅ ¡Todas las canciones ya tienen audio descargado!');
    return;
  }

  console.log(`🎯 Encontradas ${songs.length} canciones sin audio`);
  console.log('');

  // Procesar cada canción
  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    console.log(`[${i + 1}/${songs.length}] "${song.title}" - ${song.artist}`);
    console.log(`   YouTube ID: ${song.youtubeId}`);

    try {
      // Descargar MP3
      const audioPath = await downloadMP3(song.youtubeId);

      // Actualizar DB
      await updateSongAudioPath(song.id, audioPath);

      stats.downloaded++;
      console.log(`   ✅ Completado\n`);

      // Pausa entre descargas para no saturar
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      stats.errors++;
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Resumen final
  console.log('');
  console.log('📊 RESUMEN FINAL');
  console.log('================');
  console.log(`Total procesadas: ${stats.total}`);
  console.log(`Descargadas exitosamente: ${stats.downloaded}`);
  console.log(`Errores: ${stats.errors}`);
  console.log('');

  if (stats.downloaded > 0) {
    console.log('✅ Descarga completada exitosamente!');

    // Verificar si quedan más canciones sin audio
    const remaining = await getSongsWithoutAudio(1);
    if (remaining.length > 0) {
      console.log('💡 Ejecuta de nuevo para descargar más canciones:');
      console.log('   npm run download:mp3');
    } else {
      console.log('🎉 ¡Todas las canciones tienen audio!');
    }
  }
}

/**
 * Verificar que el servidor y yt-dlp estén disponibles
 */
async function checkDependencies() {
  // Verificar servidor
  try {
    await axios.get(`${API_BASE_URL}/music/songs/count`);
    console.log('✅ Servidor conectado');
  } catch (error) {
    console.error('❌ Error: El servidor no está corriendo en localhost:3000');
    console.error('💡 Ejecuta: npm run start:dev');
    return false;
  }

  // Verificar yt-dlp
  try {
    const ytdlpPath = '/home/crigca/yt-dlp';
    const { stdout } = await execAsync(`${ytdlpPath} --version`);
    console.log(`✅ yt-dlp instalado (v${stdout.trim()})`);
  } catch (error) {
    console.error('❌ Error: yt-dlp no está instalado');
    console.error('💡 Descarga desde: https://github.com/yt-dlp/yt-dlp');
    return false;
  }

  // Verificar que existe el directorio de audio
  if (!fs.existsSync(AUDIO_DIR)) {
    console.log('📁 Creando directorio de audio...');
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  console.log('');
  return true;
}

/**
 * Ejecutar script
 */
async function main() {
  const ready = await checkDependencies();
  if (ready) {
    await downloadSongs();
  }
}

main().catch(console.error);
