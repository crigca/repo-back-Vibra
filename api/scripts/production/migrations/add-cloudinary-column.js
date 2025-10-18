const { DataSource } = require('typeorm');
require('dotenv').config({ path: '/home/crigca/vibra/back/api/.env' });

async function addCloudinaryColumn() {
  console.log('🔌 Conectando a Railway PostgreSQL...');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado a Railway');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    console.log('\n📊 Verificando si la columna cloudinaryUrl existe...');

    // Verificar si la columna existe
    const checkColumn = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'songs'
      AND column_name = 'cloudinaryUrl';
    `);

    if (checkColumn.length > 0) {
      console.log('⚠️  La columna cloudinaryUrl ya existe');
    } else {
      console.log('➕ Agregando columna cloudinaryUrl...');

      // Agregar la columna
      await queryRunner.query(`
        ALTER TABLE songs
        ADD COLUMN "cloudinaryUrl" VARCHAR(500);
      `);

      console.log('✅ Columna cloudinaryUrl agregada exitosamente');

      // Crear índice para mejor rendimiento
      console.log('🔍 Creando índice...');
      await queryRunner.query(`
        CREATE INDEX idx_songs_cloudinary_url
        ON songs("cloudinaryUrl")
        WHERE "cloudinaryUrl" IS NOT NULL;
      `);
      console.log('✅ Índice creado');
    }

    // Mostrar estadísticas
    console.log('\n📊 Estadísticas de la tabla songs:');
    const stats = await queryRunner.query(`
      SELECT
        COUNT(*) as total_songs,
        COUNT("cloudinaryUrl") as songs_with_cloudinary,
        COUNT(*) - COUNT("cloudinaryUrl") as songs_without_cloudinary
      FROM songs;
    `);

    console.log('Total de canciones:', stats[0].total_songs);
    console.log('Con cloudinaryUrl:', stats[0].songs_with_cloudinary);
    console.log('Sin cloudinaryUrl:', stats[0].songs_without_cloudinary);

    await queryRunner.release();
    await dataSource.destroy();

    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

addCloudinaryColumn();
