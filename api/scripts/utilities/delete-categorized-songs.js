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

async function deleteCategorizedSongs() {
  try {
    console.log('🗑️  Borrando canciones que ya tienen categoría...\n');

    await dataSource.initialize();
    console.log('✅ Conectado a la base de datos\n');

    // Primero ver cuántas hay
    const beforeCount = await dataSource.query(`
      SELECT COUNT(*) as count
      FROM songs
      WHERE genre NOT IN ('sinCategoria', 'otros')
    `);

    console.log(`📊 Canciones con categoría válida: ${beforeCount[0].count}`);

    // Borrar todas las canciones que NO son sinCategoria u otros
    const result = await dataSource.query(`
      DELETE FROM songs
      WHERE genre NOT IN ('sinCategoria', 'otros')
    `);

    console.log(`✅ Canciones borradas: ${result[1]}`);

    // Ver cuántas quedan
    const afterCount = await dataSource.query(`
      SELECT COUNT(*) as count FROM songs
    `);

    console.log(`📋 Total de canciones restantes: ${afterCount[0].count}\n`);

    await dataSource.destroy();
    console.log('✅ Proceso completado\n');
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

deleteCategorizedSongs();
