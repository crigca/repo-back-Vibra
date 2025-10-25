const { DataSource } = require('typeorm');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config({ path: '/home/crigca/vibra/back/api/.env' });

const execAsync = promisify(exec);

// Configuración
const TEMP_DIR = path.join(__dirname, 'temp_downloads');
const LIMIT_PER_RUN = 500; // Procesar 500 canciones por ejecución

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configurar base de datos
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Estadísticas
let stats = {
  total: 0,
  completed: 0,
  skipped: 0,
  errors: 0
};

/**
 * Normalizar nombre de género para carpeta
 */
function normalizeGenre(genre) {
  if (!genre) return 'unknown';

  return genre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Verificar si el error es un video inválido permanentemente
 */
function isInvalidVideo(errorMessage) {
  const invalidPatterns = [
    'Private video',
    'Sign in to confirm your age',
    'Video unavailable',
    'This video is not available',
    'Video has been removed',
    'This video is no longer available',
    'This video has been removed by the uploader'
  ];

  return invalidPatterns.some(pattern => errorMessage.includes(pattern));
}

/**
 * Eliminar canción de la base de datos
 */
async function deleteSongFromDB(songId, reason) {
  await dataSource.query(
    `DELETE FROM songs WHERE id = $1`,
    [songId]
  );
  console.log(`   🗑️  Eliminada de BD: ${reason}`);
}

/**
 * Descargar MP3 desde YouTube usando yt-dlp
 */
async function downloadFromYouTube(youtubeId) {
  const url = `https://www.youtube.com/watch?v=${youtubeId}`;
  const outputPath = path.join(TEMP_DIR, `${youtubeId}.mp3`);

  console.log(`   ⬇️  Descargando desde YouTube...`);

  try {
    const ytdlpPath = '/home/crigca/yt-dlp';
    const ffmpegPath = '/home/crigca/ffmpeg-master-latest-linux64-gpl/bin/ffmpeg';

    const command = `${ytdlpPath} -x --audio-format mp3 --audio-quality 0 --ffmpeg-location "${ffmpegPath}" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" --extractor-retries 3 --retries 5 --sleep-requests 1 -o "${outputPath}" "${url}"`;

    await execAsync(command, {
      timeout: 120000 // 2 minutos timeout
    });

    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`   ✅ Descargado: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      return outputPath;
    } else {
      throw new Error('Archivo no se creó');
    }
  } catch (error) {
    console.error(`   ❌ Error descargando: ${error.message}`);
    // Limpiar archivo incompleto si existe
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    // Marcar si es un video inválido permanentemente
    error.isInvalidVideo = isInvalidVideo(error.message);
    throw error;
  }
}

/**
 * Subir MP3 a Cloudinary
 */
async function uploadToCloudinary(filePath, youtubeId, genre) {
  try {
    const normalizedGenre = normalizeGenre(genre);
    const folder = `vibra/music/${normalizedGenre}`;

    console.log(`   ⬆️  Subiendo a Cloudinary (carpeta: ${folder})...`);

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'video',
      public_id: youtubeId,
      overwrite: false,
    });

    console.log(`   ✅ Subido a Cloudinary`);
    console.log(`   🔗 URL: ${result.secure_url}`);

    return result.secure_url;
  } catch (error) {
    console.error(`   ❌ Error subiendo a Cloudinary: ${error.message}`);
    throw error;
  }
}

/**
 * Obtener canciones sin cloudinaryUrl
 */
async function getSongsWithoutCloudinary(limit) {
  const result = await dataSource.query(
    `SELECT id, title, artist, "youtubeId", genre
     FROM songs
     WHERE ("cloudinaryUrl" IS NULL OR "cloudinaryUrl" = '')
     AND "youtubeId" IS NOT NULL
     LIMIT $1`,
    [limit]
  );
  return result;
}

/**
 * Actualizar cloudinaryUrl en la base de datos
 */
async function updateCloudinaryUrl(songId, cloudinaryUrl) {
  await dataSource.query(
    `UPDATE songs
     SET "cloudinaryUrl" = $1, "updatedAt" = NOW()
     WHERE id = $2`,
    [cloudinaryUrl, songId]
  );
  console.log(`   📝 DB actualizada con cloudinaryUrl`);
}

/**
 * Procesar descarga y subida de canciones
 */
async function processDownloadAndUpload() {
  console.log('🎵 DESCARGA DESDE YOUTUBE Y SUBIDA A CLOUDINARY');
  console.log('================================================');
  console.log(`Límite por ejecución: ${LIMIT_PER_RUN} canciones\n`);

  // Crear directorio temporal
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    console.log(`📁 Directorio temporal creado: ${TEMP_DIR}\n`);
  }

  // Conectar a la base de datos
  console.log('🔌 Conectando a Railway PostgreSQL...');
  await dataSource.initialize();
  console.log('✅ Conectado a Railway\n');

  // Obtener canciones sin cloudinaryUrl
  console.log('📋 Obteniendo canciones sin Cloudinary URL...');
  const songs = await getSongsWithoutCloudinary(LIMIT_PER_RUN);
  stats.total = songs.length;

  if (songs.length === 0) {
    console.log('✅ ¡Todas las canciones ya están en Cloudinary!');
    await dataSource.destroy();
    return;
  }

  console.log(`🎯 Encontradas ${songs.length} canciones para procesar\n`);

  // Procesar cada canción
  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    console.log(`\n[${i + 1}/${songs.length}] "${song.title}" - ${song.artist}`);
    console.log(`   Género: ${song.genre || 'unknown'}`);
    console.log(`   YouTube ID: ${song.youtubeId}`);

    let tempFilePath = null;

    try {
      // 1. Descargar desde YouTube
      tempFilePath = await downloadFromYouTube(song.youtubeId);

      // 2. Subir a Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(
        tempFilePath,
        song.youtubeId,
        song.genre
      );

      // 3. Actualizar base de datos
      await updateCloudinaryUrl(song.id, cloudinaryUrl);

      stats.completed++;
      console.log(`   ✅ COMPLETADO`);

      // Limpiar archivo temporal
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        console.log(`   🗑️  Archivo temporal eliminado`);
      }

      // Pausa entre canciones
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      // Si es un video inválido permanentemente, eliminarlo de la BD
      if (error.isInvalidVideo) {
        await deleteSongFromDB(song.id, error.message.split('\n')[0]);
        stats.errors++;
      } else {
        stats.errors++;
        console.log(`   ❌ ERROR: ${error.message}`);
      }

      // Limpiar archivo temporal en caso de error
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  // Resumen final
  console.log('\n\n📊 RESUMEN FINAL');
  console.log('================');
  console.log(`Total procesadas: ${stats.total}`);
  console.log(`Completadas exitosamente: ${stats.completed}`);
  console.log(`Errores: ${stats.errors}`);

  // Verificar cuántas quedan
  const remaining = await getSongsWithoutCloudinary(1);
  const stats_final = await dataSource.query(`
    SELECT
      COUNT(*) as total_songs,
      COUNT("cloudinaryUrl") as songs_with_cloudinary,
      COUNT(*) - COUNT("cloudinaryUrl") as songs_without_cloudinary
    FROM songs;
  `);

  console.log('\n📈 ESTADO DE LA BASE DE DATOS:');
  console.log(`  Total de canciones: ${stats_final[0].total_songs}`);
  console.log(`  Con cloudinaryUrl: ${stats_final[0].songs_with_cloudinary}`);
  console.log(`  Sin cloudinaryUrl: ${stats_final[0].songs_without_cloudinary}`);

  if (remaining.length > 0) {
    console.log('\n💡 Ejecuta de nuevo para procesar más canciones:');
    console.log('   npm run download:upload:cloudinary');
  } else {
    console.log('\n🎉 ¡Todas las canciones están en Cloudinary!');
  }

  await dataSource.destroy();
}

/**
 * Verificar dependencias
 */
async function checkDependencies() {
  console.log('🔍 Verificando dependencias...\n');

  // Verificar yt-dlp
  try {
    const ytdlpPath = '/home/crigca/yt-dlp';
    const { stdout } = await execAsync(`${ytdlpPath} --version`);
    console.log(`✅ yt-dlp instalado (v${stdout.trim()})`);
  } catch (error) {
    console.error('❌ Error: yt-dlp no está instalado');
    return false;
  }

  // Verificar ffmpeg
  try {
    const ffmpegPath = '/home/crigca/ffmpeg-master-latest-linux64-gpl/bin/ffmpeg';
    const { stdout } = await execAsync(`${ffmpegPath} -version | head -1`);
    console.log(`✅ ffmpeg instalado`);
  } catch (error) {
    console.error('❌ Error: ffmpeg no está instalado');
    return false;
  }

  // Verificar Cloudinary
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.error('❌ Error: Variables de Cloudinary no configuradas');
    return false;
  }
  console.log(`✅ Cloudinary configurado: ${process.env.CLOUDINARY_CLOUD_NAME}`);

  console.log('');
  return true;
}

/**
 * Ejecutar script
 */
async function main() {
  const ready = await checkDependencies();
  if (ready) {
    await processDownloadAndUpload();
  }
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});
