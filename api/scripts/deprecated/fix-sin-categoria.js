const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Cargar el mapa de artistas por género
const { artistsByGenre } = require('../../data/artists-data');

// =====================
// CONFIGURACIÓN
// =====================
const API_BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '../../reports');

// Crear directorio de reportes si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// =====================
// ESTADÍSTICAS
// =====================
const stats = {
  total: 0,
  categorized: 0,
  stillUncategorized: 0,
  errors: 0
};

const stillUncategorizedSongs = [];

// =====================
// NORMALIZACIÓN
// =====================

/**
 * Normaliza un string para comparación
 */
function normalizeString(str) {
  if (!str) return '';

  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Crea un mapa invertido: artista normalizado → género
 */
function createArtistGenreMap() {
  const map = new Map();

  for (const [genre, artists] of Object.entries(artistsByGenre)) {
    for (const artist of artists) {
      const normalized = normalizeString(artist);
      map.set(normalized, genre);
    }
  }

  return map;
}

const artistGenreMap = createArtistGenreMap();

/**
 * Detecta el género de un artista
 */
function detectGenre(artist) {
  if (!artist) return null;

  const normalized = normalizeString(artist);
  return artistGenreMap.get(normalized) || null;
}

// =====================
// API FUNCTIONS
// =====================

async function getSinCategoriaSongs() {
  try {
    console.log('🔍 Buscando canciones "Sin categoría"...\n');

    const response = await axios.get(`${API_BASE_URL}/music/songs/all-raw`, {
      params: { limit: 10000 }
    });

    const allSongs = response.data;
    const sinCategoria = allSongs.filter(s => s.genre === 'Sin categoría');

    stats.total = sinCategoria.length;

    console.log(`📊 Encontradas ${sinCategoria.length} canciones "Sin categoría"\n`);
    return sinCategoria;

  } catch (error) {
    console.error('❌ Error obteniendo canciones:', error.message);
    return [];
  }
}

async function updateSong(songId, updates) {
  try {
    await axios.patch(`${API_BASE_URL}/music/songs/${songId}`, updates);
    return true;
  } catch (error) {
    console.error(`❌ Error actualizando canción ${songId}:`, error.message);
    return false;
  }
}

// =====================
// CATEGORIZACIÓN
// =====================

async function categorizeSongs(songs) {
  console.log('🎯 Intentando categorizar canciones...\n');
  console.log('='.repeat(70) + '\n');

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];

    console.log(`[${i + 1}/${songs.length}] Procesando:`);
    console.log(`   Título: "${song.title}"`);
    console.log(`   Artista: "${song.artist}"`);

    const detectedGenre = detectGenre(song.artist);

    if (detectedGenre) {
      // Género encontrado ✅
      const success = await updateSong(song.id, { genre: detectedGenre });

      if (success) {
        console.log(`   ✅ Categorizado → ${detectedGenre}\n`);
        stats.categorized++;
      } else {
        console.log(`   ❌ Error al actualizar\n`);
        stats.errors++;
      }
    } else {
      // Género NO encontrado → Dejar como "Otros"
      const success = await updateSong(song.id, { genre: 'Otros' });

      if (success) {
        console.log(`   ⚠️  No categorizado → Asignado a "Otros"\n`);
        stats.stillUncategorized++;

        stillUncategorizedSongs.push({
          id: song.id,
          title: song.title,
          artist: song.artist,
          youtubeId: song.youtubeId,
          viewCount: song.viewCount || 0
        });
      } else {
        console.log(`   ❌ Error al actualizar\n`);
        stats.errors++;
      }
    }

    // Pausa pequeña para no saturar
    await new Promise(resolve => setTimeout(resolve, 30));
  }
}

// =====================
// REPORTES
// =====================

function generateReports() {
  console.log('\n' + '='.repeat(70));
  console.log('📄 GENERANDO REPORTES');
  console.log('='.repeat(70) + '\n');

  // Reporte JSON
  const jsonReport = {
    timestamp: new Date().toISOString(),
    stats,
    stillUncategorizedSongs
  };

  const jsonPath = path.join(OUTPUT_DIR, 'fix-sin-categoria-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
  console.log(`📄 Reporte JSON: ${jsonPath}`);

  // CSV de canciones que aún no se pudieron categorizar
  if (stillUncategorizedSongs.length > 0) {
    const csvLines = [
      'ID,Título,Artista,YouTube ID,Vistas'
    ];

    stillUncategorizedSongs.forEach(song => {
      csvLines.push(`"${song.id}","${song.title}","${song.artist}","${song.youtubeId}",${song.viewCount}`);
    });

    const csvPath = path.join(OUTPUT_DIR, 'still-uncategorized-songs.csv');
    fs.writeFileSync(csvPath, csvLines.join('\n'));
    console.log(`📄 Canciones sin categorizar (CSV): ${csvPath}`);
  }

  console.log('\n✅ Reportes generados!\n');
}

// =====================
// RESUMEN
// =====================

function printSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(70) + '\n');

  console.log(`Total de canciones "Sin categoría" encontradas: ${stats.total}`);
  console.log(`✅ Categorizadas exitosamente: ${stats.categorized} (${((stats.categorized / stats.total) * 100).toFixed(1)}%)`);
  console.log(`⚠️  Aún sin categorizar (ahora "Otros"): ${stats.stillUncategorized} (${((stats.stillUncategorized / stats.total) * 100).toFixed(1)}%)`);
  console.log(`❌ Errores: ${stats.errors}\n`);

  if (stats.categorized > 0) {
    console.log(`🎉 ¡Éxito! Se categorizaron ${stats.categorized} canciones automáticamente.`);
  }

  if (stats.stillUncategorized > 0) {
    console.log(`\n📋 Revisa el archivo CSV para ver las ${stats.stillUncategorized} canciones que necesitan categorización manual:`);
    console.log(`   ${OUTPUT_DIR}/still-uncategorized-songs.csv`);
    console.log(`\n💡 Opciones:`);
    console.log(`   1. Agregar los artistas faltantes a artists-data.js`);
    console.log(`   2. Categorizarlas manualmente en la base de datos`);
    console.log(`   3. Ejecutar este script nuevamente después de agregar artistas`);
  }

  console.log('\n✅ PROCESO COMPLETADO!\n');
}

// =====================
// MAIN
// =====================

async function main() {
  console.log('\n🔧 FIX: CANCIONES "SIN CATEGORÍA"');
  console.log('='.repeat(70));
  console.log('Este script intentará categorizar automáticamente todas');
  console.log('las canciones marcadas como "Sin categoría" usando el');
  console.log('mapa de artistas de artists-data.js');
  console.log('='.repeat(70) + '\n');

  // Verificar servidor
  try {
    await axios.get(`${API_BASE_URL}/music/songs/count`);
    console.log('✅ Servidor conectado\n');
  } catch (error) {
    console.error('❌ Error: El servidor no está corriendo en localhost:3000');
    console.error('💡 Ejecuta: npm run start:dev');
    return;
  }

  try {
    // Obtener canciones sin categoría
    const songs = await getSinCategoriaSongs();

    if (songs.length === 0) {
      console.log('✨ ¡No hay canciones "Sin categoría"!');
      console.log('Todo está categorizado correctamente.\n');
      return;
    }

    console.log('⏳ Esperando 3 segundos antes de comenzar...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Categorizar canciones
    await categorizeSongs(songs);

    // Generar reportes
    generateReports();

    // Mostrar resumen
    printSummary();

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
