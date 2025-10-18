const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

async function testServices() {
  console.log('🧪 Testing CloudinaryService and PromptService...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Obtener servicios
    const { CloudinaryService } = require('../dist/images/services/cloudinary.service');
    const { PromptService } = require('../dist/images/services/prompt.service');

    const cloudinaryService = app.get(CloudinaryService);
    const promptService = app.get(PromptService);

    console.log('✅ Services loaded\n');

    // Test 1: CloudinaryService - Generar URLs
    console.log('📸 Test 1: CloudinaryService - Generate URLs\n');

    const samplePublicId = 'cld-sample-5';

    const fullSizeUrl = cloudinaryService.generateFullSize(samplePublicId);
    const thumbnailUrl = cloudinaryService.generateThumbnail(samplePublicId);
    const previewUrl = cloudinaryService.generatePreview(samplePublicId);

    console.log(`Full size (1200x1200): ${fullSizeUrl}`);
    console.log(`Thumbnail (400x400): ${thumbnailUrl}`);
    console.log(`Preview (800x800): ${previewUrl}`);
    console.log('');

    // Test 2: CloudinaryService - Custom transformations
    console.log('📸 Test 2: CloudinaryService - Custom transformations\n');

    const customUrl = cloudinaryService.getImageUrl(samplePublicId, {
      width: 600,
      height: 600,
      crop: 'fill',
      quality: 'auto:good',
      format: 'webp',
    });

    console.log(`Custom (600x600, WebP): ${customUrl}`);
    console.log('');

    // Test 3: PromptService - Get all genres
    console.log('🎵 Test 3: PromptService - Get all genres\n');

    const genres = await promptService.getAllGenres();
    console.log(`Total genres: ${genres.length}`);
    console.log(`First 10 genres: ${genres.slice(0, 10).join(', ')}`);
    console.log('');

    // Test 4: PromptService - Get random prompt by genre
    console.log('🎵 Test 4: PromptService - Get random prompt by genre\n');

    const testGenres = ['Rock', 'Pop', 'Electronic', 'Jazz'];

    for (const genre of testGenres) {
      try {
        const prompt = await promptService.getRandomPromptByGenre(genre);
        console.log(`Genre: ${genre}`);
        console.log(`  Category: ${prompt.category}`);
        console.log(`  Prompt: ${prompt.promptText.substring(0, 80)}...`);
        console.log(`  Usage count: ${prompt.usageCount}`);
        console.log('');
      } catch (error) {
        console.log(`Genre: ${genre} - ERROR: ${error.message}\n`);
      }
    }

    // Test 5: PromptService - Get stats
    console.log('📊 Test 5: PromptService - Get statistics\n');

    const stats = await promptService.getPromptStats();
    console.log(`Total prompts: ${stats.totalPrompts}`);
    console.log(`Active prompts: ${stats.activePrompts}`);
    console.log(`Total genres: ${stats.totalGenres}`);
    console.log(`Categories:`, stats.categoryCounts);
    console.log('');

    console.log('🎉 All tests completed successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

testServices();
