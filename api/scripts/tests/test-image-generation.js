const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

async function testImageGeneration() {
  console.log('🧪 Testing Image Generation End-to-End...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const { ImagesService } = require('../dist/images/services/images.service');
    const { DataSource } = require('typeorm');

    const imagesService = app.get(ImagesService);
    const dataSource = app.get(DataSource);

    console.log('✅ Services loaded\n');

    // 1. Obtener una canción de prueba de PostgreSQL
    console.log('📀 Step 1: Get a test song from PostgreSQL\n');

    const songs = await dataSource.query('SELECT id, title, artist, genre FROM songs LIMIT 5');

    if (songs.length === 0) {
      console.error('❌ No songs found in database. Run seed-music.js first.');
      return;
    }

    console.log('Available songs:');
    songs.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.title} by ${s.artist} (${s.genre}) - ID: ${s.id}`);
    });
    console.log('');

    const testSong = songs[0];
    console.log(`Using: ${testSong.title} by ${testSong.artist}\n`);

    // 2. Generar imagen
    console.log('🎨 Step 2: Generate image...\n');

    const startTime = Date.now();
    const generatedImage = await imagesService.generateImage({
      songId: testSong.id,
      category: 'base',
    });
    const totalTime = Date.now() - startTime;

    console.log(`✅ Image generated in ${totalTime}ms\n`);

    // 3. Mostrar resultado
    console.log('📊 Generated Image Details:\n');
    console.log(`  ID: ${generatedImage._id}`);
    console.log(`  Song ID: ${generatedImage.songId}`);
    console.log(`  Genre: ${generatedImage.genre}`);
    console.log(`  Generator: ${generatedImage.generator}`);
    console.log(`  Processing Time: ${generatedImage.processingTime}ms`);
    console.log(`  Image URL: ${generatedImage.imageUrl}`);
    console.log(`  Thumbnail URL: ${generatedImage.thumbnailUrl}`);
    console.log(`  Cloudinary Public ID: ${generatedImage.cloudinaryPublicId}`);
    console.log(`  Prompt: ${generatedImage.prompt.substring(0, 100)}...`);
    console.log('');

    // 4. Verificar que se guardó en MongoDB
    console.log('🗄️  Step 3: Verify saved in MongoDB\n');

    const { images, total } = await imagesService.getImagesBySong(testSong.id);
    console.log(`  Found ${total} image(s) for this song`);
    console.log('');

    // 5. Obtener estadísticas
    console.log('📈 Step 4: Get image statistics\n');

    const stats = await imagesService.getImageStats();
    console.log(`  Total images: ${stats.total}`);
    console.log(`  Average processing time: ${stats.avgProcessingTime}ms`);
    console.log(`  Unique songs: ${stats.uniqueSongs}`);
    console.log(`  Unique genres: ${stats.uniqueGenres}`);
    console.log('');

    if (stats.byGenre && stats.byGenre.length > 0) {
      console.log('  Top genres:');
      stats.byGenre.slice(0, 5).forEach((g) => {
        console.log(`    - ${g.genre}: ${g.count} image(s)`);
      });
      console.log('');
    }

    console.log('🎉 All tests passed!\n');
    console.log('💡 URLs to test in browser:');
    console.log(`   Full: ${generatedImage.imageUrl}`);
    console.log(`   Thumb: ${generatedImage.thumbnailUrl}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

testImageGeneration();
