const { DataSource } = require('typeorm');
require('dotenv').config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Función para convertir a camelCase
function toCamelCase(str) {
  // Casos especiales
  if (str === 'Sin categoría') return 'sinCategoria';
  if (str === 'Otros') return 'otros';

  // Convertir primera letra a minúscula
  return str.charAt(0).toLowerCase() + str.slice(1);
}

async function convertGenresToCamelCase() {
  try {
    console.log('🔄 Convirtiendo géneros a camelCase...\n');

    await dataSource.initialize();
    console.log('✅ Conectado a la base de datos\n');

    // Obtener todos los géneros únicos
    const genres = await dataSource.query(`
      SELECT DISTINCT genre
      FROM songs
      WHERE genre IS NOT NULL
      ORDER BY genre
    `);

    console.log(`📋 Total de géneros únicos: ${genres.length}\n`);

    let totalUpdated = 0;
    const updates = [];

    for (const { genre } of genres) {
      const camelCaseGenre = toCamelCase(genre);

      if (genre !== camelCaseGenre) {
        const result = await dataSource.query(
          `UPDATE songs
           SET genre = $1
           WHERE genre = $2
           RETURNING id`,
          [camelCaseGenre, genre]
        );

        if (result.length > 0) {
          console.log(`✅ "${genre}" → "${camelCaseGenre}": ${result.length} canciones`);
          totalUpdated += result.length;
          updates.push({ from: genre, to: camelCaseGenre, count: result.length });
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`📊 Total de canciones actualizadas: ${totalUpdated}`);
    console.log(`📊 Total de géneros convertidos: ${updates.length}`);
    console.log('='.repeat(70));

    // Mostrar resumen actualizado
    console.log('\n📈 Estado actualizado (top 30 géneros):\n');

    const byGenre = await dataSource.query(`
      SELECT
        COALESCE(genre, 'Sin género') as genre,
        COUNT(*) as count
      FROM songs
      GROUP BY genre
      ORDER BY count DESC
      LIMIT 30
    `);

    byGenre.forEach(row => {
      const emoji = row.genre === 'sinCategoria' || row.genre === 'otros' ? '⚠️ ' : '✅';
      console.log(`${emoji} ${row.genre}: ${row.count}`);
    });

    const total = await dataSource.query('SELECT COUNT(*) as count FROM songs');
    console.log('\n' + '='.repeat(70));
    console.log(`Total de canciones: ${total[0].count}`);
    console.log('='.repeat(70));

    await dataSource.destroy();
    console.log('\n✅ Proceso completado exitosamente\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

convertGenresToCamelCase();
