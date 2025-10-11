const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testCloudinary() {
  console.log('🧪 Testing Cloudinary connection...\n');

  try {
    // Test 1: Verificar configuración
    console.log('✅ Configuration loaded:');
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY}`);
    console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'NOT SET'}\n`);

    // Test 2: Ping API (verificar que las credenciales son válidas)
    console.log('📡 Testing API connection...');
    const pingResult = await cloudinary.api.ping();
    console.log('✅ API Ping successful:', pingResult);
    console.log('');

    // Test 3: Listar recursos (debería estar vacío al inicio)
    console.log('📂 Checking existing resources...');
    const resources = await cloudinary.api.resources({
      max_results: 5,
    });
    console.log(`✅ Found ${resources.resources.length} resources in your cloud`);
    if (resources.resources.length > 0) {
      console.log('   Recent uploads:');
      resources.resources.forEach((r) => {
        console.log(`   - ${r.public_id} (${r.format}, ${r.bytes} bytes)`);
      });
    }
    console.log('');

    // Test 4: Generar URL de transformación (sin subir nada)
    console.log('🔗 Testing URL generation...');
    const testUrl = cloudinary.url('sample', {
      width: 400,
      height: 400,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    });
    console.log('✅ Generated transformation URL:');
    console.log(`   ${testUrl}\n`);

    console.log('🎉 All tests passed! Cloudinary is ready to use.\n');
    console.log('📊 Account limits (Free tier):');
    console.log('   - Storage: 25GB');
    console.log('   - Bandwidth: 25GB/month');
    console.log('   - Transformations: Unlimited');
    console.log('');

  } catch (error) {
    console.error('❌ Error testing Cloudinary:', error.message);
    if (error.error && error.error.message) {
      console.error('   Details:', error.error.message);
    }
    process.exit(1);
  }
}

testCloudinary();
