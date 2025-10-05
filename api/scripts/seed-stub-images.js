/**
 * Script para pre-cargar imágenes Stub en MongoDB
 * Carga las 81 imágenes placeholder de todos los géneros
 * Ejecutar UNA SOLA VEZ para tener imágenes de respaldo
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function seedStubImages() {
  console.log('📸 Pre-cargando imágenes Stub en MongoDB...\n');

  try {
    // Obtener todas las canciones
    const songsResponse = await axios.get(`${API_URL}/music/songs`, {
      params: { limit: 1000 }
    });

    const songs = songsResponse.data;
    console.log(`📋 Total de canciones: ${songs.length}\n`);

    // Agrupar por género
    const genreMap = new Map();
    songs.forEach(song => {
      if (!genreMap.has(song.genre)) {
        genreMap.set(song.genre, song);
      }
    });

    const uniqueGenres = Array.from(genreMap.entries());
    console.log(`🎵 Géneros únicos: ${uniqueGenres.length}\n`);

    // Verificar qué géneros YA tienen imagen
    const imagesResponse = await axios.get(`${API_URL}/images/stats`);
    const existingGenres = new Set(
      imagesResponse.data.data.byGenre.map(g => g.genre).filter(Boolean)
    );

    console.log(`✅ Géneros con imagen existente: ${existingGenres.size}`);
    console.log(`❌ Géneros sin imagen: ${uniqueGenres.length - existingGenres.size}\n`);

    // Cambiar temporalmente a StubGenerator en el módulo
    console.log('⚙️  Asegúrate de cambiar temporalmente a StubGenerator en images.module.ts');
    console.log('   useClass: StubImageGenerator\n');

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('¿Ya cambiaste a StubGenerator? (s/n): ', async (answer) => {
      readline.close();

      if (answer.toLowerCase() !== 's') {
        console.log('\n❌ Cancelado. Cambia el generador y vuelve a ejecutar.');
        process.exit(0);
      }

      let generated = 0;
      let skipped = 0;

      // Generar imagen para cada género SIN imagen
      for (let i = 0; i < uniqueGenres.length; i++) {
        const [genre, song] = uniqueGenres[i];

        if (existingGenres.has(genre)) {
          console.log(`[${i + 1}/${uniqueGenres.length}] ⏭️  ${genre} - Ya existe, omitiendo`);
          skipped++;
          continue;
        }

        try {
          console.log(`[${i + 1}/${uniqueGenres.length}] 📸 Generando Stub para: ${genre}...`);

          const response = await axios.post(`${API_URL}/images/generate`, {
            songId: song.id
          });

          if (response.data.success) {
            console.log(`   ✅ Stub guardado - ${response.data.data.generator}`);
            generated++;
          }

        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
        }

        // Pequeña pausa para no saturar
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('\n' + '='.repeat(60));
      console.log('📊 RESUMEN:');
      console.log(`   ✅ Generadas: ${generated}`);
      console.log(`   ⏭️  Omitidas (ya existían): ${skipped}`);
      console.log(`   📦 Total en MongoDB: ${generated + existingGenres.size}`);
      console.log('='.repeat(60));
      console.log('\n⚠️  Recuerda volver a cambiar a PrimaryAIGenerator en images.module.ts\n');

      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  }
}

seedStubImages();
