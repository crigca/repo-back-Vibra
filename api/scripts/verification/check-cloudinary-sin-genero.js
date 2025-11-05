const { DataSource } = require('typeorm');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '/home/crigca/vibra/back/api/.env' });

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

async function getAllCloudinaryResources() {
  console.log('📥 Obteniendo archivos de Cloudinary...');

  let allResources = [];
  let nextCursor = null;

  do {
    const options = {
      type: 'upload',
      prefix: 'vibra/music/',
      resource_type: 'video',
      max_results: 500,
    };

    if (nextCursor) {
      options.next_cursor = nextCursor;
    }

    const result = await cloudinary.api.resources(options);
    allResources = allResources.concat(result.resources);
    nextCursor = result.next_cursor;

    console.log(`  Obtenidos: ${allResources.length} archivos...`);
  } while (nextCursor);

  console.log(`✅ Total de archivos en Cloudinary: ${allResources.length}\n`);
  return allResources;
}

async function checkSongsWithoutGenre() {
  try {
    console.log('🔌 Conectando a Railway PostgreSQL...\n');
    await dataSource.initialize();
    console.log('✅ Conectado a Railway\n');

    // Obtener todos los archivos de Cloudinary
    const cloudinaryFiles = await getAllCloudinaryResources();

    if (cloudinaryFiles.length === 0) {
      console.log('⚠️  No hay archivos en Cloudinary');
      process.exit(0);
    }

    console.log('🔍 Analizando canciones sin género...\n');

    const genreCounts = {};
    const songsWithoutGenreInDB = [];
    const songsWithSinCategoriaInDB = [];
    const songsNotInDB = [];

    for (const file of cloudinaryFiles) {
      // Extraer información del public_id
      // Formato: vibra/music/{genre}/{youtubeId}
      const parts = file.public_id.split('/');
      const genre = parts[2]; // El género está en la posición 2
      const youtubeId = parts[3]; // El youtubeId está en la posición 3

      // Contar por género en Cloudinary
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;

      // Buscar la canción en la base de datos
      try {
        const result = await dataSource.query(
          `SELECT id, title, artist, genre, "youtubeId"
           FROM songs
           WHERE "youtubeId" = $1`,
          [youtubeId]
        );

        if (result.length > 0) {
          const song = result[0];

          // Verificar si no tiene género en la DB
          if (!song.genre || song.genre === '') {
            songsWithoutGenreInDB.push({
              youtubeId,
              title: song.title,
              artist: song.artist,
              cloudinaryGenre: genre,
              cloudinaryUrl: file.secure_url
            });
          } else if (song.genre === 'Sin categoría') {
            songsWithSinCategoriaInDB.push({
              youtubeId,
              title: song.title,
              artist: song.artist,
              cloudinaryGenre: genre,
              cloudinaryUrl: file.secure_url
            });
          }
        } else {
          songsNotInDB.push({
            youtubeId,
            cloudinaryGenre: genre,
            cloudinaryUrl: file.secure_url
          });
        }
      } catch (error) {
        console.error(`  ❌ Error consultando ${youtubeId}: ${error.message}`);
      }
    }

    // Mostrar resultados
    console.log('======================================================================');
    console.log('📊 RESUMEN DE GÉNEROS EN CLOUDINARY');
    console.log('======================================================================\n');

    const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);

    sortedGenres.forEach(([genre, count]) => {
      const emoji = genre === 'Sin categoría' || genre === 'sin-categoria' ? '⚠️ ' : '✅';
      console.log(`${emoji} ${genre}: ${count} archivos`);
    });

    console.log('\n======================================================================');
    console.log('⚠️  CANCIONES SIN GÉNERO EN LA BASE DE DATOS (pero con género en Cloudinary)');
    console.log('======================================================================\n');

    if (songsWithoutGenreInDB.length > 0) {
      console.log(`Total: ${songsWithoutGenreInDB.length} canciones\n`);
      songsWithoutGenreInDB.slice(0, 10).forEach(song => {
        console.log(`  • ${song.title} - ${song.artist}`);
        console.log(`    YouTube ID: ${song.youtubeId}`);
        console.log(`    Género en Cloudinary: ${song.cloudinaryGenre}`);
        console.log(`    URL: ${song.cloudinaryUrl}\n`);
      });
      if (songsWithoutGenreInDB.length > 10) {
        console.log(`  ... y ${songsWithoutGenreInDB.length - 10} más\n`);
      }
    } else {
      console.log('✅ No hay canciones sin género en la base de datos\n');
    }

    console.log('======================================================================');
    console.log('⚠️  CANCIONES CON "Sin categoría" EN LA BASE DE DATOS');
    console.log('======================================================================\n');

    if (songsWithSinCategoriaInDB.length > 0) {
      console.log(`Total: ${songsWithSinCategoriaInDB.length} canciones\n`);
      songsWithSinCategoriaInDB.slice(0, 10).forEach(song => {
        console.log(`  • ${song.title} - ${song.artist}`);
        console.log(`    YouTube ID: ${song.youtubeId}`);
        console.log(`    Género en Cloudinary: ${song.cloudinaryGenre}`);
        console.log(`    URL: ${song.cloudinaryUrl}\n`);
      });
      if (songsWithSinCategoriaInDB.length > 10) {
        console.log(`  ... y ${songsWithSinCategoriaInDB.length - 10} más\n`);
      }
    } else {
      console.log('✅ No hay canciones con "Sin categoría"\n');
    }

    console.log('======================================================================');
    console.log('📋 ARCHIVOS EN CLOUDINARY SIN REGISTRO EN BASE DE DATOS');
    console.log('======================================================================\n');

    if (songsNotInDB.length > 0) {
      console.log(`Total: ${songsNotInDB.length} archivos\n`);
      songsNotInDB.slice(0, 10).forEach(song => {
        console.log(`  • YouTube ID: ${song.youtubeId}`);
        console.log(`    Género en Cloudinary: ${song.cloudinaryGenre}`);
        console.log(`    URL: ${song.cloudinaryUrl}\n`);
      });
      if (songsNotInDB.length > 10) {
        console.log(`  ... y ${songsNotInDB.length - 10} más\n`);
      }
    } else {
      console.log('✅ Todos los archivos de Cloudinary tienen registro en la DB\n');
    }

    console.log('======================================================================');
    console.log('📈 RESUMEN FINAL');
    console.log('======================================================================');
    console.log(`  Total de archivos en Cloudinary: ${cloudinaryFiles.length}`);
    console.log(`  Canciones sin género en DB: ${songsWithoutGenreInDB.length}`);
    console.log(`  Canciones con "Sin categoría" en DB: ${songsWithSinCategoriaInDB.length}`);
    console.log(`  Archivos sin registro en DB: ${songsNotInDB.length}`);
    console.log('======================================================================\n');

    await dataSource.destroy();
    console.log('✅ Análisis completado');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en el análisis:', error.message);
    console.error(error.stack);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

checkSongsWithoutGenre();
