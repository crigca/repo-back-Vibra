#!/usr/bin/env node

/**
 * Script para limpiar archivos huérfanos en Cloudinary
 *
 * Cuando se eliminan canciones de la BD, los archivos MP3 quedan en Cloudinary.
 * Este script:
 * 1. Obtiene todos los archivos de Cloudinary en la carpeta vibra/music/
 * 2. Compara con las canciones en la BD
 * 3. Elimina archivos que ya no tienen canción asociada
 */

const axios = require('axios');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configurar Cloudinary desde variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function getAllSongsFromDB() {
  console.log('📦 Obteniendo todas las canciones de la BD...');

  let allSongs = [];
  let offset = 0;
  const limit = 500;
  let hasMore = true;

  while (hasMore) {
    const response = await axios.get(`${API_BASE_URL}/music/songs/all-raw`, {
      params: { limit, offset }
    });

    const songs = response.data;
    allSongs = allSongs.concat(songs);

    if (songs.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  console.log(`✅ Obtenidas ${allSongs.length} canciones de la BD\n`);
  return allSongs;
}

async function getAllCloudinaryFiles() {
  console.log('☁️  Obteniendo archivos de Cloudinary...');

  let allFiles = [];
  let nextCursor = null;

  try {
    do {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'vibra/music/',
        resource_type: 'video', // MP3 se almacena como "video"
        max_results: 500,
        next_cursor: nextCursor
      });

      allFiles = allFiles.concat(result.resources);
      nextCursor = result.next_cursor;

      console.log(`   Obtenidos ${result.resources.length} archivos (total: ${allFiles.length})`);
    } while (nextCursor);

    console.log(`✅ Total de archivos en Cloudinary: ${allFiles.length}\n`);
    return allFiles;
  } catch (error) {
    console.error('❌ Error obteniendo archivos de Cloudinary:', error.message);
    if (error.http_code === 401) {
      console.error('   Credenciales de Cloudinary inválidas. Verifica las variables de entorno:');
      console.error('   - CLOUDINARY_CLOUD_NAME');
      console.error('   - CLOUDINARY_API_KEY');
      console.error('   - CLOUDINARY_API_SECRET');
    }
    throw error;
  }
}

async function deleteCloudinaryFile(publicId) {
  try {
    await cloudinary.api.delete_resources([publicId], {
      type: 'upload',
      resource_type: 'video'
    });
    return true;
  } catch (error) {
    console.error(`   ❌ Error eliminando ${publicId}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🧹 LIMPIEZA DE ARCHIVOS HUÉRFANOS EN CLOUDINARY');
  console.log('================================================\n');

  // Verificar configuración de Cloudinary
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ ERROR: Variables de entorno de Cloudinary no configuradas');
    console.error('\nConfigura las siguientes variables:');
    console.error('  export CLOUDINARY_CLOUD_NAME="tu_cloud_name"');
    console.error('  export CLOUDINARY_API_KEY="tu_api_key"');
    console.error('  export CLOUDINARY_API_SECRET="tu_api_secret"\n');
    process.exit(1);
  }

  // Obtener canciones de BD
  const dbSongs = await getAllSongsFromDB();

  // Crear set de YouTube IDs en la BD
  const dbYouTubeIds = new Set(dbSongs.map(s => s.youtubeId));

  // Obtener archivos de Cloudinary
  const cloudinaryFiles = await getAllCloudinaryFiles();

  // Identificar archivos huérfanos
  const orphanedFiles = [];

  cloudinaryFiles.forEach(file => {
    // Extraer YouTube ID del public_id
    // Formato: vibra/music/GENRE/YOUTUBE_ID.mp3
    const match = file.public_id.match(/vibra\/music\/[^\/]+\/(.+)$/);
    if (match) {
      const youtubeId = match[1];

      // Si el YouTube ID NO está en la BD, es huérfano
      if (!dbYouTubeIds.has(youtubeId)) {
        orphanedFiles.push({
          publicId: file.public_id,
          youtubeId: youtubeId,
          bytes: file.bytes,
          url: file.secure_url
        });
      }
    }
  });

  console.log('📊 ANÁLISIS:');
  console.log('------------');
  console.log(`  Archivos en Cloudinary: ${cloudinaryFiles.length}`);
  console.log(`  Canciones en BD: ${dbSongs.length}`);
  console.log(`  Archivos huérfanos: ${orphanedFiles.length}`);

  if (orphanedFiles.length === 0) {
    console.log('\n✅ No hay archivos huérfanos en Cloudinary\n');
    return;
  }

  const totalBytes = orphanedFiles.reduce((sum, f) => sum + f.bytes, 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  console.log(`  Espacio a liberar: ${totalMB} MB\n`);

  console.log('🗑️  ARCHIVOS HUÉRFANOS (primeros 20):');
  console.log('-------------------------------------');
  orphanedFiles.slice(0, 20).forEach((file, i) => {
    const sizeMB = (file.bytes / (1024 * 1024)).toFixed(2);
    console.log(`  ${i + 1}. ${file.youtubeId} (${sizeMB} MB)`);
  });

  if (orphanedFiles.length > 20) {
    console.log(`  ... y ${orphanedFiles.length - 20} más`);
  }

  if (!process.argv.includes('--delete')) {
    console.log('\n⚠️  CONFIRMACIÓN REQUERIDA:');
    console.log('---------------------------');
    console.log('Para eliminar estos archivos de Cloudinary, ejecuta:');
    console.log('  node scripts/cleanup-orphaned-cloudinary-files.js --delete\n');
    return;
  }

  // Eliminar archivos huérfanos
  console.log('\n🗑️  ELIMINANDO ARCHIVOS DE CLOUDINARY...');
  console.log('----------------------------------------');

  let deleted = 0;
  let errors = 0;

  for (const file of orphanedFiles) {
    const success = await deleteCloudinaryFile(file.publicId);
    if (success) {
      deleted++;
      if (deleted % 10 === 0 || deleted === orphanedFiles.length) {
        console.log(`  Progreso: ${deleted}/${orphanedFiles.length} eliminados...`);
      }
    } else {
      errors++;
    }

    // Pausa para no saturar API de Cloudinary
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✅ LIMPIEZA COMPLETADA:`);
  console.log(`  Archivos eliminados: ${deleted}`);
  console.log(`  Errores: ${errors}`);
  console.log(`  Espacio liberado: ${totalMB} MB\n`);
}

main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
