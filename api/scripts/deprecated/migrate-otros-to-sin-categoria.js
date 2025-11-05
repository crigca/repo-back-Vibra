const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrateSongs() {
  console.log('\n🔧 MIGRAR: CANCIONES DE "OTROS" A "SIN CATEGORÍA"');
  console.log('======================================================================');
  console.log('Este script moverá todas las canciones de "Otros" a "Sin categoría"');
  console.log('======================================================================\n');

  try {
    // Verificar conexión con el servidor
    await axios.get(`${API_BASE_URL}/music/songs/all-raw`);
    console.log('✅ Servidor conectado\n');
  } catch (error) {
    console.error('❌ Error: No se puede conectar al servidor');
    console.error('   Asegúrate de que el servidor esté corriendo en el puerto 3000\n');
    process.exit(1);
  }

  try {
    // Obtener todas las canciones "Otros"
    console.log('🔍 Buscando canciones "Otros"...\n');
    const response = await axios.get(`${API_BASE_URL}/music/songs/all-raw`);
    const allSongs = response.data;

    const otrosSongs = allSongs.filter(song =>
      song.genre?.toLowerCase() === 'otros'
    );

    console.log(`📊 Encontradas ${otrosSongs.length} canciones "Otros"\n`);

    if (otrosSongs.length === 0) {
      console.log('✅ No hay canciones para migrar\n');
      return;
    }

    console.log('⏳ Esperando 3 segundos antes de comenzar...\n');
    await sleep(3000);

    console.log('🎯 Migrando canciones...\n');
    console.log('======================================================================\n');

    let migratedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < otrosSongs.length; i++) {
      const song = otrosSongs[i];

      console.log(`[${i + 1}/${otrosSongs.length}] Procesando:`);
      console.log(`   Título: "${song.title}"`);
      console.log(`   Artista: "${song.artist}"`);

      try {
        await axios.patch(`${API_BASE_URL}/music/songs/${song.id}`, {
          genre: 'Sin categoría'
        });

        migratedCount++;
        console.log(`   ✅ Migrado → Sin categoría\n`);
      } catch (error) {
        errorCount++;
        console.log(`   ❌ Error al migrar\n`);
      }

      // Pequeña pausa entre requests
      await sleep(100);
    }

    // Resumen final
    console.log('======================================================================');
    console.log('📊 RESUMEN FINAL');
    console.log('======================================================================');
    console.log(`Total canciones procesadas: ${otrosSongs.length}`);
    console.log(`✅ Migradas: ${migratedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log('======================================================================\n');

  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

migrateSongs();
