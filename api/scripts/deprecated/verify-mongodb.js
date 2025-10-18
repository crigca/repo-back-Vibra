const mongoose = require('mongoose');
require('dotenv').config();

async function verifyMongoDB() {
  console.log('🔍 Verifying MongoDB Atlas data...\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Verificar colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📂 Collections:');
    collections.forEach((c) => {
      console.log(`   - ${c.name}`);
    });
    console.log('');

    // Verificar prompts
    const promptsCount = await mongoose.connection.db.collection('prompts').countDocuments();
    console.log(`📊 Total prompts: ${promptsCount}\n`);

    if (promptsCount > 0) {
      const samplePrompts = await mongoose.connection.db.collection('prompts').find().limit(3).toArray();
      console.log('📋 Sample prompts:\n');
      samplePrompts.forEach((p, i) => {
        console.log(`${i + 1}. ${p.genre} (${p.category})`);
        console.log(`   "${p.promptText.substring(0, 100)}..."`);
        console.log('');
      });

      // Stats por categoría
      const byCategory = await mongoose.connection.db.collection('prompts').aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]).toArray();

      console.log('📊 By category:');
      byCategory.forEach((c) => {
        console.log(`   ${c._id}: ${c.count}`);
      });
      console.log('');
    }

    await mongoose.disconnect();
    console.log('✅ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyMongoDB();
