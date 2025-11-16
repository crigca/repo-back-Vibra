const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: false,
  entities: [],
});

async function deleteCatupecuSong() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a Railway PostgreSQL');

    // Search for the song
    const songs = await AppDataSource.query(
      `SELECT id, title, artist, "youtubeId" FROM songs WHERE title ILIKE '%Pises sin el Suelo%' AND artist ILIKE '%Catupecu%'`
    );

    console.log(`\n📊 Encontradas ${songs.length} canción(es):\n`);

    if (songs.length === 0) {
      console.log('❌ No se encontró ninguna canción con "Pises sin el Suelo" de "Catupecu Machu"');
      await AppDataSource.destroy();
      return;
    }

    // Display found songs
    songs.forEach((song, index) => {
      console.log(`${index + 1}. "${song.title}" - ${song.artist} (ID: ${song.id})`);
    });

    // Delete the songs
    console.log('\n🗑️  Eliminando canciones...\n');

    for (const song of songs) {
      await AppDataSource.query(`DELETE FROM songs WHERE id = $1`, [song.id]);
      console.log(`✅ Eliminada: "${song.title}" - ${song.artist}`);
    }

    console.log(`\n✅ Total eliminadas: ${songs.length} canción(es)`);

    await AppDataSource.destroy();
    console.log('\n✅ Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteCatupecuSong();
