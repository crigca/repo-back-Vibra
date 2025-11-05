const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function verifyCloudinaryFolders() {
  try {
    console.log('🔍 Verificando carpetas de Cloudinary...\n');

    // Leer géneros del JSON
    const genresPath = path.join(__dirname, 'production/images/genres.json');
    const genres = JSON.parse(fs.readFileSync(genresPath, 'utf-8'));

    // Filtrar "Sin categoría"
    const validGenres = genres.filter(g => g !== 'Sin categoría');

    console.log(`📋 Total de géneros a verificar: ${validGenres.length}\n`);

    // Obtener todas las carpetas existentes de música
    console.log('📥 Obteniendo carpetas de música existentes...');
    const musicFolders = await getAllFolders('vibra/music/');
    console.log(`   ✅ Encontradas ${musicFolders.size} carpetas de música\n`);

    // Obtener todas las carpetas existentes de imágenes
    console.log('📥 Obteniendo carpetas de imágenes existentes...');
    const imageFolders = await getAllFolders('vibra/ai-generated/');
    console.log(`   ✅ Encontradas ${imageFolders.size} carpetas de imágenes\n`);

    // Verificar carpetas faltantes
    const missingMusicFolders = [];
    const missingImageFolders = [];

    for (const genre of validGenres) {
      const musicFolder = `vibra/music/${genre}`;
      const imageFolder = `vibra/ai-generated/${genre}`;

      if (!musicFolders.has(musicFolder)) {
        missingMusicFolders.push(genre);
      }

      if (!imageFolders.has(imageFolder)) {
        missingImageFolders.push(genre);
      }
    }

    // Mostrar resultados
    console.log('='.repeat(70));
    console.log('📊 RESULTADOS:');
    console.log('='.repeat(70));

    if (missingMusicFolders.length === 0) {
      console.log('\n✅ Todas las carpetas de música existen');
    } else {
      console.log(`\n⚠️  Carpetas de música faltantes (${missingMusicFolders.length}):`);
      missingMusicFolders.forEach(genre => {
        console.log(`   - vibra/music/${genre}/`);
      });
    }

    if (missingImageFolders.length === 0) {
      console.log('\n✅ Todas las carpetas de imágenes existen');
    } else {
      console.log(`\n⚠️  Carpetas de imágenes faltantes (${missingImageFolders.length}):`);
      missingImageFolders.forEach(genre => {
        console.log(`   - vibra/ai-generated/${genre}/`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('📝 NOTA:');
    console.log('   Las carpetas en Cloudinary se crean automáticamente');
    console.log('   cuando subes el primer archivo a esa ruta.');
    console.log('   No es necesario crearlas manualmente.');
    console.log('='.repeat(70) + '\n');

    // Mostrar carpetas existentes de música
    console.log('📂 Carpetas de música existentes:');
    const musicGenres = Array.from(musicFolders)
      .map(f => f.replace('vibra/music/', '').replace('/', ''))
      .filter(g => g)
      .sort();
    console.log(`   Total: ${musicGenres.length}`);
    musicGenres.slice(0, 20).forEach(g => console.log(`   ✅ ${g}`));
    if (musicGenres.length > 20) {
      console.log(`   ... y ${musicGenres.length - 20} más`);
    }

    console.log('\n📂 Carpetas de imágenes existentes:');
    const imageGenres = Array.from(imageFolders)
      .map(f => f.replace('vibra/ai-generated/', '').replace('/', ''))
      .filter(g => g)
      .sort();
    console.log(`   Total: ${imageGenres.length}`);
    imageGenres.slice(0, 20).forEach(g => console.log(`   ✅ ${g}`));
    if (imageGenres.length > 20) {
      console.log(`   ... y ${imageGenres.length - 20} más`);
    }

    console.log('\n✅ Verificación completada\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

async function getAllFolders(prefix) {
  const folders = new Set();
  let nextCursor = null;

  do {
    try {
      const options = {
        type: 'upload',
        prefix: prefix,
        max_results: 500,
      };

      if (nextCursor) {
        options.next_cursor = nextCursor;
      }

      // Intentar con video (música)
      let result;
      try {
        result = await cloudinary.api.resources({
          ...options,
          resource_type: 'video'
        });
      } catch (e) {
        // Si falla con video, intentar con image
        result = await cloudinary.api.resources({
          ...options,
          resource_type: 'image'
        });
      }

      // Extraer carpetas de los public_ids
      result.resources.forEach(resource => {
        const parts = resource.public_id.split('/');
        if (parts.length >= 3) {
          const folder = parts.slice(0, 3).join('/');
          folders.add(folder);
        }
      });

      nextCursor = result.next_cursor;

    } catch (error) {
      console.error(`   ⚠️  Error obteniendo recursos: ${error.message}`);
      break;
    }
  } while (nextCursor);

  return folders;
}

verifyCloudinaryFolders();
