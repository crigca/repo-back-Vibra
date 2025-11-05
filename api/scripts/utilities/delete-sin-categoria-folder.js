const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function deleteSinCategoriaFolder() {
  try {
    console.log('🗑️  Borrando carpeta sin-categoria de Cloudinary...\n');

    // Obtener todos los archivos de la carpeta
    let allResources = [];
    let nextCursor = null;

    do {
      const options = {
        type: 'upload',
        prefix: 'vibra/music/sin-categoria/',
        resource_type: 'video',
        max_results: 500,
      };

      if (nextCursor) {
        options.next_cursor = nextCursor;
      }

      const result = await cloudinary.api.resources(options);
      allResources = allResources.concat(result.resources);
      nextCursor = result.next_cursor;

      console.log(`  Encontrados: ${allResources.length} archivos...`);
    } while (nextCursor);

    console.log(`\n✅ Total de archivos a borrar: ${allResources.length}\n`);

    if (allResources.length === 0) {
      console.log('✅ No hay archivos para borrar\n');
      return;
    }

    // Borrar archivos en lotes de 100
    console.log('🗑️  Borrando archivos...\n');
    let deleted = 0;

    for (let i = 0; i < allResources.length; i += 100) {
      const batch = allResources.slice(i, i + 100);
      const publicIds = batch.map(r => r.public_id);

      try {
        await cloudinary.api.delete_resources(publicIds, {
          resource_type: 'video',
          type: 'upload'
        });

        deleted += publicIds.length;
        console.log(`  ✅ Borrados: ${deleted}/${allResources.length}`);
      } catch (error) {
        console.error(`  ❌ Error borrando lote: ${error.message}`);
      }

      // Pausa pequeña entre lotes para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(70));
    console.log(`✅ Proceso completado`);
    console.log(`   Total borrados: ${deleted}/${allResources.length}`);
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

deleteSinCategoriaFolder();
