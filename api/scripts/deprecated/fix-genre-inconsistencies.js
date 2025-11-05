const { DataSource } = require('typeorm');
require('dotenv').config();

// Configurar base de datos
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Mapeo de géneros incorrectos -> correctos
const genreMapping = {
  // Pop variants
  'pop': 'Pop',
  'POP': 'Pop',

  // Reggaeton variants
  'reggaeton': 'Reggaeton',

  // Kpop variants
  'kpop': 'Kpop',

  // Jpop variants
  'jpop': 'Jpop',

  // Trap variants
  'trap': 'Trap',

  // Hip hop variants
  'hiphop': 'Hiphop',
  'Hip-Hop': 'Hiphop',

  // Drill variants
  'drill': 'Drill',

  // EDM variants
  'edmActual': 'EdmActual',

  // Bachata variants
  'bachata': 'Bachata',

  // Cumbia420 variants
  'cumbia420': 'Cumbia420',

  // Corridos Tumbados variants
  'corridosTumbados': 'CorridosTumbados',

  // Pop Latino variants
  'popLatinoActual': 'PopLatinoActual',
  'Pop Latino': 'PopLatinoActual',
  'Pop Latino Clasico': 'PopLatinoClasico',

  // Urbano Latino variants
  'urbanoLatino': 'UrbanoLatino',
  'Urbano': 'UrbanoLatino',

  // Rock Argentino variants
  'rockArgentino': 'RockArgentino',
  'Rock Argentino': 'RockArgentino',
  'Rock Nacional': 'RockArgentino',

  // Rock Latino variants
  'Rock Latino': 'RockLatino',

  // Alternative Rock variants
  'alternativeRock': 'AlternativeRock',
  'Alternative Rock': 'AlternativeRock',

  // R&B variants
  'rb': 'Rb',

  // Alternative variants
  'Alternative Pop': 'Alternative',

  // Samba Pagode variants
  'sambaPagode': 'SambaPagode',

  // Pop 90s variants
  'pop90s': 'Pop90s',

  // Afrobeat variants
  'afrobeat': 'Afrobeat',

  // Cumbia Villera variants
  'cumbiaVillera': 'CumbiaVillera',

  // Dembow variants
  'dembow': 'Dancehall', // Dembow es similar a Dancehall

  // Balada variants
  'balada': 'Balada',

  // Trap Argentino variants
  'trapArgentino': 'TrapArgentino',

  // New Wave variants
  'newWave': 'NewWave',

  // Synthpop variants
  'synthpop': 'Synthpop',

  // Salsa variants
  'salsa': 'Salsa',

  // Trova Cubana variants
  'trovaCubana': 'TrovaCubana',

  // Opera variants
  'opera': 'Opera',

  // Ska variants
  'ska': 'Ska',

  // Punk variants
  'punk': 'Punk',

  // Merengue variants
  'merengue': 'Merengue',

  // House variants
  'house': 'House',

  // Indie Rock variants
  'indieRock': 'IndieRock',

  // Techno variants
  'techno': 'Techno',

  // Reggae variants
  'reggae': 'Reggae',

  // Bossa Nova variants
  'bossaNova': 'BossaNova',

  // Industrial Metal variants
  'Industrial Metal': 'IndustrialMetal',

  // Latin generic -> specific
  'Latin': 'PopLatinoActual',
};

async function fixGenreInconsistencies() {
  try {
    console.log('🔧 Arreglando inconsistencias de géneros...\n');

    await dataSource.initialize();
    console.log('✅ Conectado a la base de datos\n');

    let totalUpdated = 0;

    // Procesar cada mapeo
    for (const [incorrectGenre, correctGenre] of Object.entries(genreMapping)) {
      const result = await dataSource.query(
        `UPDATE songs
         SET genre = $1
         WHERE genre = $2
         RETURNING id`,
        [correctGenre, incorrectGenre]
      );

      if (result.length > 0) {
        console.log(`✅ "${incorrectGenre}" -> "${correctGenre}": ${result.length} canciones actualizadas`);
        totalUpdated += result.length;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`📊 Total de canciones actualizadas: ${totalUpdated}`);
    console.log('='.repeat(70));

    // Mostrar resumen actualizado
    console.log('\n📈 Estado actualizado de géneros:\n');

    const byGenre = await dataSource.query(`
      SELECT
        COALESCE(genre, 'Sin género') as genre,
        COUNT(*) as count
      FROM songs
      GROUP BY genre
      ORDER BY count DESC
      LIMIT 50
    `);

    byGenre.forEach(row => {
      const emoji = row.genre === 'Sin categoría' || row.genre === 'Otros' ? '⚠️ ' : '✅';
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

fixGenreInconsistencies();
