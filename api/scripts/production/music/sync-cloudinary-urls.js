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

  console.log(`✅ Total de archivos en Cloudinary: ${allResources.length}`);
  return allResources;
}

async function syncCloudinaryUrls() {
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

    console.log('\n🔄 Sincronizando URLs con la base de datos...\n');

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const file of cloudinaryFiles) {
      // Extraer youtubeId del public_id
      // Formato: vibra/music/{genre}/{youtubeId}
      const parts = file.public_id.split('/');
      const youtubeId = parts[parts.length - 1];

      try {
        // Buscar la canción por youtubeId
        const result = await dataSource.query(
          `UPDATE songs
           SET "cloudinaryUrl" = $1
           WHERE "youtubeId" = $2
           AND ("cloudinaryUrl" IS NULL OR "cloudinaryUrl" = '')
           RETURNING id`,
          [file.secure_url, youtubeId]
        );

        if (result.length > 0) {
          updated++;
          if (updated % 100 === 0) {
            console.log(`  ✅ Actualizadas: ${updated} canciones`);
          }
        } else {
          notFound++;
        }
      } catch (error) {
        errors++;
        console.error(`  ❌ Error con ${youtubeId}: ${error.message}`);
      }
    }

    console.log('\n📊 RESUMEN FINAL:');
    console.log(`  ✅ Actualizadas: ${updated}`);
    console.log(`  ⚠️  No encontradas en DB: ${notFound}`);
    console.log(`  ❌ Errores: ${errors}`);
    console.log(`  📁 Total en Cloudinary: ${cloudinaryFiles.length}`);

    // Mostrar estadísticas finales
    const stats = await dataSource.query(`
      SELECT
        COUNT(*) as total_songs,
        COUNT("cloudinaryUrl") as songs_with_cloudinary,
        COUNT(*) - COUNT("cloudinaryUrl") as songs_without_cloudinary
      FROM songs;
    `);

    console.log('\n📈 ESTADO DE LA BASE DE DATOS:');
    console.log(`  Total de canciones: ${stats[0].total_songs}`);
    console.log(`  Con cloudinaryUrl: ${stats[0].songs_with_cloudinary}`);
    console.log(`  Sin cloudinaryUrl: ${stats[0].songs_without_cloudinary}`);

    await dataSource.destroy();
    console.log('\n✅ Sincronización completada');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en la sincronización:', error.message);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

syncCloudinaryUrls();
