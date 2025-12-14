const mongoose = require('mongoose');
require('dotenv').config();

async function analyzeImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const images = mongoose.connection.db.collection('generatedImages');
    const prompts = mongoose.connection.db.collection('prompts');

    // Total de imágenes
    const totalImages = await images.countDocuments({ isActive: true });
    console.log('═══════════════════════════════════════════════════════════');
    console.log('            ANÁLISIS DE IMÁGENES EN MONGODB');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n📊 Total imágenes activas:', totalImages);

    // Por género
    const byGenre = await images.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log('\n📁 IMÁGENES POR GÉNERO (' + byGenre.length + ' géneros con imágenes):');
    console.log('───────────────────────────────────────────────────────────');
    byGenre.forEach(g => {
      const bar = '█'.repeat(Math.min(Math.ceil(g.count / 5), 20));
      console.log('  ' + (g._id || 'null').padEnd(25) + ' ' + String(g.count).padStart(4) + ' ' + bar);
    });

    // Por generador
    const byGenerator = await images.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$generator', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log('\n🤖 IMÁGENES POR GENERADOR (IA):');
    console.log('───────────────────────────────────────────────────────────');
    byGenerator.forEach(g => {
      const pct = totalImages > 0 ? ((g.count / totalImages) * 100).toFixed(1) : 0;
      console.log('  ' + (g._id || 'unknown').padEnd(25) + ' ' + String(g.count).padStart(4) + ' (' + pct + '%)');
    });

    // Géneros sin imágenes
    const allGenres = require('./data/genres.json');
    const genresWithImages = byGenre.map(g => g._id);
    const genresWithoutImages = allGenres.filter(g => !genresWithImages.includes(g));

    console.log('\n⚠️  GÉNEROS SIN IMÁGENES (' + genresWithoutImages.length + '/' + allGenres.length + '):');
    console.log('───────────────────────────────────────────────────────────');
    if (genresWithoutImages.length > 0) {
      genresWithoutImages.forEach(g => console.log('  ❌ ' + g));
    } else {
      console.log('  ✅ Todos los géneros tienen imágenes!');
    }

    // Géneros con pocas imágenes (menos de 10)
    const genresLowImages = byGenre.filter(g => g.count < 10);
    if (genresLowImages.length > 0) {
      console.log('\n⚠️  GÉNEROS CON POCAS IMÁGENES (<10):');
      console.log('───────────────────────────────────────────────────────────');
      genresLowImages.forEach(g => console.log('  ⚡ ' + g._id + ': ' + g.count));
    }

    // Prompts disponibles
    const totalPrompts = await prompts.countDocuments({ isActive: true });
    const promptsByGenre = await prompts.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$genre', count: { $sum: 1 } } }
    ]).toArray();

    console.log('\n📝 PROMPTS:');
    console.log('───────────────────────────────────────────────────────────');
    console.log('  Total prompts activos:', totalPrompts);
    console.log('  Géneros con prompts:', promptsByGenre.length);

    // Resumen de costos estimados
    console.log('\n💰 COSTOS ESTIMADOS DE GENERACIÓN:');
    console.log('───────────────────────────────────────────────────────────');
    const dalleCount = byGenerator.find(g => g._id && g._id.includes('Primary'))?.count || 0;
    const replicateCount = byGenerator.find(g => g._id && g._id.includes('Secondary'))?.count || 0;
    const falCount = byGenerator.find(g => g._id && g._id.includes('Tertiary'))?.count || 0;

    const dalleCost = dalleCount * 0.04;
    const replicateCost = replicateCount * 0.002;
    const falCost = falCount * 0.001;
    const totalCost = dalleCost + replicateCost + falCost;

    console.log('  DALL-E 3:    ' + dalleCount + ' imgs × $0.04  = $' + dalleCost.toFixed(2));
    console.log('  Replicate:   ' + replicateCount + ' imgs × $0.002 = $' + replicateCost.toFixed(2));
    console.log('  FAL AI:      ' + falCount + ' imgs × $0.001 = $' + falCost.toFixed(2));
    console.log('  ────────────────────────────────────');
    console.log('  TOTAL GASTADO: $' + totalCost.toFixed(2));

    console.log('\n═══════════════════════════════════════════════════════════');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

analyzeImages();
