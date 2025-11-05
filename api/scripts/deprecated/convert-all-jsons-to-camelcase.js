const fs = require('fs');
const path = require('path');

// Función para convertir a camelCase
function toCamelCase(str) {
  if (str === 'Sin categoría') return 'sinCategoria';
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Función para convertir un array de géneros
function convertGenresArray(genres) {
  return genres.map(toCamelCase);
}

// Función para convertir un objeto con géneros
function convertGenresObject(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toCamelCase(key)] = value;
  }
  return result;
}

function updateFile(filePath, converterFn) {
  console.log(`\n📝 Actualizando: ${path.basename(filePath)}`);

  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const updated = converterFn(content);

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n');
  console.log(`   ✅ Actualizado`);
}

console.log('🔄 Convirtiendo todos los archivos JSON a camelCase...\n');

const baseDir = '/home/crigca/vibra/back/api/scripts';

// 1. Actualizar genre-families.json
console.log('═'.repeat(70));
console.log('1. GENRE-FAMILIES.JSON');
console.log('═'.repeat(70));

const genreFamiliesPaths = [
  path.join(baseDir, 'data/genre-families.json'),
  path.join(baseDir, 'production/images/genre-families.json')
];

genreFamiliesPaths.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    updateFile(filePath, (content) => {
      const result = {};
      for (const [family, genres] of Object.entries(content)) {
        result[family] = convertGenresArray(genres);
      }
      return result;
    });
  }
});

// 2. Actualizar genres-tiers.json
console.log('\n' + '═'.repeat(70));
console.log('2. GENRES-TIERS.JSON');
console.log('═'.repeat(70));

const genresTiersPaths = [
  path.join(baseDir, 'data/genres-tiers.json'),
  path.join(baseDir, 'production/images/genres-tiers.json')
];

genresTiersPaths.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    updateFile(filePath, (content) => {
      const result = {};
      for (const [tier, data] of Object.entries(content)) {
        result[tier] = {
          ...data,
          genres: convertGenresArray(data.genres)
        };
      }
      return result;
    });
  }
});

// 3. Actualizar prompts.json
console.log('\n' + '═'.repeat(70));
console.log('3. PROMPTS.JSON');
console.log('═'.repeat(70));

const promptsPaths = [
  path.join(baseDir, 'data/prompts.json'),
  path.join(baseDir, 'production/images/prompts.json')
];

promptsPaths.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    updateFile(filePath, convertGenresObject);
  }
});

// 4. Verificar genres.json en data/
console.log('\n' + '═'.repeat(70));
console.log('4. GENRES.JSON (data)');
console.log('═'.repeat(70));

const dataGenresPath = path.join(baseDir, 'data/genres.json');
if (fs.existsSync(dataGenresPath)) {
  updateFile(dataGenresPath, convertGenresArray);
}

console.log('\n' + '═'.repeat(70));
console.log('✅ Todos los archivos JSON han sido actualizados a camelCase');
console.log('═'.repeat(70));
console.log('\n📋 Archivos actualizados:');
console.log('   - genre-families.json (2 ubicaciones)');
console.log('   - genres-tiers.json (2 ubicaciones)');
console.log('   - prompts.json (2 ubicaciones)');
console.log('   - genres.json (data/)');
console.log('\n✅ Proceso completado\n');
