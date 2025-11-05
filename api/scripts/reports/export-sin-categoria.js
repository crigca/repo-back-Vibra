const { DataSource } = require('typeorm');
const fs = require('fs');
const path = require('path');
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

async function exportSinCategoria() {
  try {
    console.log('📊 Exportando canciones sin categoría...\n');

    await dataSource.initialize();
    console.log('✅ Conectado a la base de datos\n');

    // Obtener canciones con sinCategoria
    const sinCategoria = await dataSource.query(`
      SELECT id, title, artist, genre, "youtubeId", "cloudinaryUrl", duration, "viewCount"
      FROM songs
      WHERE genre = 'sinCategoria'
      ORDER BY artist, title
    `);

    // Obtener canciones con otros
    const otros = await dataSource.query(`
      SELECT id, title, artist, genre, "youtubeId", "cloudinaryUrl", duration, "viewCount"
      FROM songs
      WHERE genre = 'otros'
      ORDER BY artist, title
    `);

    console.log(`📋 Canciones con "sinCategoria": ${sinCategoria.length}`);
    console.log(`📋 Canciones con "otros": ${otros.length}`);
    console.log(`📋 Total sin categorizar: ${sinCategoria.length + otros.length}\n`);

    // Crear objeto para exportar
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalSinCategoria: sinCategoria.length,
        totalOtros: otros.length,
        totalUncategorized: sinCategoria.length + otros.length,
        totalSongs: (await dataSource.query('SELECT COUNT(*) as count FROM songs'))[0].count
      },
      sinCategoria: sinCategoria.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        youtubeId: song.youtubeId,
        duration: song.duration,
        viewCount: song.viewCount ? parseInt(song.viewCount) : null,
        cloudinaryUrl: song.cloudinaryUrl
      })),
      otros: otros.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        youtubeId: song.youtubeId,
        duration: song.duration,
        viewCount: song.viewCount ? parseInt(song.viewCount) : null,
        cloudinaryUrl: song.cloudinaryUrl
      }))
    };

    // Agrupar por artista para análisis
    const artistsWithSinCategoria = {};
    sinCategoria.forEach(song => {
      if (!artistsWithSinCategoria[song.artist]) {
        artistsWithSinCategoria[song.artist] = [];
      }
      artistsWithSinCategoria[song.artist].push(song.title);
    });

    const artistsWithOtros = {};
    otros.forEach(song => {
      if (!artistsWithOtros[song.artist]) {
        artistsWithOtros[song.artist] = [];
      }
      artistsWithOtros[song.artist].push(song.title);
    });

    // Guardar JSON principal
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const outputPath = path.join(reportsDir, 'canciones-sin-categoria.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    console.log('✅ Reporte guardado en:', outputPath);

    // Guardar agrupación por artistas
    const byArtistPath = path.join(reportsDir, 'sin-categoria-por-artista.json');
    const byArtistReport = {
      generatedAt: new Date().toISOString(),
      sinCategoria: Object.entries(artistsWithSinCategoria)
        .map(([artist, songs]) => ({ artist, count: songs.length, songs }))
        .sort((a, b) => b.count - a.count),
      otros: Object.entries(artistsWithOtros)
        .map(([artist, songs]) => ({ artist, count: songs.length, songs }))
        .sort((a, b) => b.count - a.count)
    };

    fs.writeFileSync(byArtistPath, JSON.stringify(byArtistReport, null, 2));
    console.log('✅ Reporte por artista guardado en:', byArtistPath);

    // Mostrar top artistas
    console.log('\n' + '='.repeat(70));
    console.log('📊 TOP 10 ARTISTAS CON MÁS CANCIONES SIN CATEGORIZAR:');
    console.log('='.repeat(70));

    const allArtists = {};
    [...sinCategoria, ...otros].forEach(song => {
      if (!allArtists[song.artist]) {
        allArtists[song.artist] = 0;
      }
      allArtists[song.artist]++;
    });

    Object.entries(allArtists)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([artist, count], index) => {
        console.log(`${index + 1}. ${artist}: ${count} canciones`);
      });

    console.log('\n' + '='.repeat(70));
    console.log('📁 ARCHIVOS GENERADOS:');
    console.log('='.repeat(70));
    console.log(`   1. ${outputPath}`);
    console.log(`   2. ${byArtistPath}`);
    console.log('='.repeat(70) + '\n');

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

exportSinCategoria();
