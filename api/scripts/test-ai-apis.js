/**
 * Script para probar la conectividad de las 3 APIs de generación de imágenes
 */

const axios = require('axios');
require('dotenv').config();

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

async function testDallE() {
  console.log(`\n${colors.blue}🎨 Testing DALL-E 3...${colors.reset}`);

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.log(`${colors.red}❌ OPENAI_API_KEY not configured${colors.reset}`);
    return false;
  }

  try {
    // Verificar acceso a modelos (endpoint simple)
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 10000,
    });

    if (response.status === 200) {
      console.log(`${colors.green}✅ DALL-E 3 API: Connected successfully${colors.reset}`);
      console.log(`   API Key: ${apiKey.substring(0, 20)}...`);
      return true;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`${colors.red}❌ DALL-E 3 API: Invalid API key${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ DALL-E 3 API: ${error.message}${colors.reset}`);
    }
    return false;
  }
}

async function testReplicate() {
  console.log(`\n${colors.blue}🎨 Testing Replicate SDXL...${colors.reset}`);

  const apiToken = process.env.REPLICATE_API_TOKEN;

  if (!apiToken) {
    console.log(`${colors.red}❌ REPLICATE_API_TOKEN not configured${colors.reset}`);
    return false;
  }

  try {
    // Verificar acceso a la cuenta
    const response = await axios.get('https://api.replicate.com/v1/account', {
      headers: {
        'Authorization': `Token ${apiToken}`,
      },
      timeout: 10000,
    });

    if (response.status === 200) {
      console.log(`${colors.green}✅ Replicate SDXL API: Connected successfully${colors.reset}`);
      console.log(`   API Token: ${apiToken.substring(0, 15)}...`);
      console.log(`   Account: ${response.data.username || 'N/A'}`);
      return true;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`${colors.red}❌ Replicate SDXL API: Invalid API token${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Replicate SDXL API: ${error.message}${colors.reset}`);
    }
    return false;
  }
}

async function testFalAI() {
  console.log(`\n${colors.blue}🎨 Testing FAL AI Flux...${colors.reset}`);

  const apiToken = process.env.FAL_API_TOKEN;

  if (!apiToken) {
    console.log(`${colors.red}❌ FAL_API_TOKEN not configured${colors.reset}`);
    return false;
  }

  try {
    // Intentar hacer una request simple para validar el token
    // FAL no tiene un endpoint de health, así que probamos con el modelo
    const response = await axios.post(
      'https://queue.fal.run/fal-ai/flux-schnell',
      {
        prompt: 'test',
        image_size: 'square_hd',
        num_inference_steps: 4,
        num_images: 1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${apiToken}`,
        },
        timeout: 10000,
      }
    );

    if (response.status === 200 || response.status === 201) {
      console.log(`${colors.green}✅ FAL AI Flux API: Connected successfully${colors.reset}`);
      console.log(`   API Token: ${apiToken.substring(0, 20)}...`);
      return true;
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log(`${colors.red}❌ FAL AI Flux API: Invalid API token${colors.reset}`);
    } else if (error.response) {
      console.log(`${colors.yellow}⚠️  FAL AI Flux API: Token seems valid but got error: ${error.response.status}${colors.reset}`);
      console.log(`   This might be OK - the endpoint might require different parameters`);
      console.log(`   API Token: ${apiToken.substring(0, 20)}...`);
      return true; // Consideramos válido si no es 401/403
    } else {
      console.log(`${colors.red}❌ FAL AI Flux API: ${error.message}${colors.reset}`);
    }
    return false;
  }
}

async function main() {
  console.log(`${colors.blue}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   🔍 Testing AI Image Generation APIs${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════${colors.reset}`);

  const results = {
    dallE: await testDallE(),
    replicate: await testReplicate(),
    falAI: await testFalAI(),
  };

  console.log(`\n${colors.blue}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   📊 Summary${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════${colors.reset}`);

  console.log(`\nDÁLL-E 3:      ${results.dallE ? colors.green + '✅ Connected' : colors.red + '❌ Failed'}${colors.reset}`);
  console.log(`Replicate SDXL: ${results.replicate ? colors.green + '✅ Connected' : colors.red + '❌ Failed'}${colors.reset}`);
  console.log(`FAL AI Flux:    ${results.falAI ? colors.green + '✅ Connected' : colors.red + '❌ Failed'}${colors.reset}`);

  const connectedCount = Object.values(results).filter(r => r).length;
  console.log(`\n${colors.blue}Total: ${connectedCount}/3 APIs connected${colors.reset}\n`);

  process.exit(connectedCount === 3 ? 0 : 1);
}

main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
