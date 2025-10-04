const { DataSource } = require('typeorm');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function extractGenres() {
  console.log('🎵 Extracting unique genres from PostgreSQL...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connected to PostgreSQL\n');

    // Extraer géneros únicos
    const result = await dataSource.query(`
      SELECT DISTINCT genre
      FROM songs
      WHERE genre IS NOT NULL AND genre != ''
      ORDER BY genre ASC
    `);

    const genres = result.map((row) => row.genre);
    console.log(`✅ Found ${genres.length} unique genres\n`);

    // Guardar en archivo JSON
    const jsonPath = path.join(__dirname, 'genres.json');
    fs.writeFileSync(jsonPath, JSON.stringify(genres, null, 2));
    console.log(`✅ Saved to: ${jsonPath}\n`);

    // Crear GENRES.md
    const mdContent = `# Géneros Musicales en Vibra

Total de géneros únicos: **${genres.length}**

## Lista Completa

${genres.map((g, i) => `${i + 1}. ${g}`).join('\n')}

---

**Generado automáticamente el:** ${new Date().toLocaleString('es-ES')}
`;

    const mdPath = path.join(__dirname, '..', 'docs', 'GENRES.md');

    // Crear carpeta docs si no existe
    const docsDir = path.join(__dirname, '..', 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    fs.writeFileSync(mdPath, mdContent);
    console.log(`✅ Documentation saved to: ${mdPath}\n`);

    // Mostrar primeros 10
    console.log('📋 First 10 genres:');
    genres.slice(0, 10).forEach((g, i) => {
      console.log(`   ${i + 1}. ${g}`);
    });
    console.log(`   ... and ${genres.length - 10} more\n`);

    await dataSource.destroy();
    console.log('🎉 Done!\n');

    return genres;
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

extractGenres();
