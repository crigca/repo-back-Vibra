const axios = require('axios');

// Función para esperar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchArtist(artistName) {
  try {
    const response = await axios.get(`http://localhost:3000/music/search`, {
      params: { query: artistName }
    });

    return response.data;
  } catch (error) {
    console.error(`   ❌ Error buscando "${artistName}":`, error.message);
    return null;
  }
}

// Lista directa de artistas con 0 canciones (de la lista que ya generamos)
const artistsWithZeroSongs = [
  // TIER 1
  { artist: "Bon Jovi", genre: "rock", tier: "tier1" },
  { artist: "Dire Straits", genre: "rock", tier: "tier1" },
  { artist: "Little Richard", genre: "rock", tier: "tier1" },
  { artist: "Buddy Holly", genre: "rock", tier: "tier1" },
  { artist: "The Kinks", genre: "rock", tier: "tier1" },
  { artist: "Van Morrison", genre: "rock", tier: "tier1" },
  { artist: "Janis Joplin", genre: "rock", tier: "tier1" },
  { artist: "Charly García", genre: "rockArgentino", tier: "tier1" },
  { artist: "Fito Páez", genre: "rockArgentino", tier: "tier1" },
  { artist: "Andrés Calamaro", genre: "rockArgentino", tier: "tier1" },
  { artist: "Babasónicos", genre: "rockArgentino", tier: "tier1" },
  { artist: "Los Auténticos Decadentes", genre: "rockArgentino", tier: "tier1" },
  { artist: "Virus", genre: "rockArgentino", tier: "tier1" },
  { artist: "Los Tipitos", genre: "rockArgentino", tier: "tier1" },
  { artist: "León Gieco", genre: "rockArgentino", tier: "tier1" },
  { artist: "David Lebón", genre: "rockArgentino", tier: "tier1" },
  { artist: "Serú Girán", genre: "rockArgentino", tier: "tier1" },
  { artist: "Ratones Paranoicos", genre: "rockArgentino", tier: "tier1" },
  { artist: "Árbol", genre: "rockArgentino", tier: "tier1" },
  { artist: "Gustavo Cerati", genre: "rockArgentino", tier: "tier1" },
  { artist: "Los Espíritus", genre: "rockArgentino", tier: "tier1" },
  { artist: "Hilda Lizarazu", genre: "rockArgentino", tier: "tier1" },
  { artist: "Marilina Bertoldi", genre: "rockArgentino", tier: "tier1" },
  { artist: "Vox Dei", genre: "rockArgentino", tier: "tier1" },
  { artist: "Color Humano", genre: "rockArgentino", tier: "tier1" },
  { artist: "Billy Bond", genre: "rockArgentino", tier: "tier1" },
  { artist: "Arco Iris", genre: "rockArgentino", tier: "tier1" },
  { artist: "Sueños Innatos", genre: "rockArgentino", tier: "tier1" },
  { artist: "Los Ángeles Azules", genre: "cumbia", tier: "tier1" },
  { artist: "Ráfaga", genre: "cumbia", tier: "tier1" },
  { artist: "Los Charros", genre: "cumbia", tier: "tier1" },
  { artist: "Lucho Bermúdez", genre: "cumbia", tier: "tier1" },
  { artist: "Pastor López", genre: "cumbia", tier: "tier1" },
  { artist: "Antonio Ríos", genre: "cumbia", tier: "tier1" },
  { artist: "Rodrigo Tapari", genre: "cumbia", tier: "tier1" },
  { artist: "Ke Personajes", genre: "cumbia", tier: "tier1" },
  { artist: "Renzo ED", genre: "cumbia", tier: "tier1" },
  { artist: "Onda Sabanera", genre: "cumbia", tier: "tier1" },
  { artist: "Fer Palacio", genre: "cumbia", tier: "tier1" },
  { artist: "Grupo 5", genre: "cumbia", tier: "tier1" },
  { artist: "Migrantes", genre: "cumbia", tier: "tier1" },
  { artist: "Maramá", genre: "cumbia", tier: "tier1" },
  { artist: "Grupo Niche", genre: "cumbia", tier: "tier1" },
  { artist: "Pibes Chorros", genre: "cumbiaVillera", tier: "tier1" },
  { artist: "Yerba Brava", genre: "cumbiaVillera", tier: "tier1" },
  { artist: "Meta Guacha", genre: "cumbiaVillera", tier: "tier1" },
  { artist: "La Base", genre: "cumbiaVillera", tier: "tier1" },
  { artist: "La Champions Liga", genre: "cumbiaVillera", tier: "tier1" },
  { artist: "Agrupación Marilyn", genre: "cumbiaVillera", tier: "tier1" },
  { artist: "Sebastián Mendoza", genre: "cumbiaVillera", tier: "tier1" },
  { artist: "El Original", genre: "cumbiaVillera", tier: "tier1" },
  { artist: "Los Peñaloza", genre: "cumbiaVillera", tier: "tier1" },
  { artist: "Rocío Quiroz", genre: "cumbiaVillera", tier: "tier1" },
  { artist: "Pablito HC", genre: "cumbiaVillera", tier: "tier1" },
  { artist: "Carlos 'La Mona' Jiménez", genre: "cuarteto", tier: "tier1" },
  { artist: "Ulises Bueno", genre: "cuarteto", tier: "tier1" },
  { artist: "Damián Córdoba", genre: "cuarteto", tier: "tier1" },
  { artist: "Walter Olmos", genre: "cuarteto", tier: "tier1" },
  { artist: "Tru-la-lá", genre: "cuarteto", tier: "tier1" },
  { artist: "Monada", genre: "cuarteto", tier: "tier1" },
  { artist: "Kaleb Di Masi", genre: "cumbia420", tier: "tier1" },
  { artist: "Pablo Lescano (colab)", genre: "cumbia420", tier: "tier1" },
  { artist: "Alan Gomez", genre: "cumbia420", tier: "tier1" },
  { artist: "Dj Tao", genre: "cumbia420", tier: "tier1" },
  { artist: "Keky", genre: "cumbia420", tier: "tier1" },
  { artist: "Damas Gratis (feat)", genre: "cumbia420", tier: "tier1" },
  { artist: "Mágico", genre: "cumbia420", tier: "tier1" },
  { artist: "Arcángel", genre: "reggaeton", tier: "tier1" },
  { artist: "Tego Calderón", genre: "reggaeton", tier: "tier1" },
  { artist: "Travis Scott", genre: "trap", tier: "tier1" },
  { artist: "Roddy Ricch", genre: "trap", tier: "tier1" },
  { artist: "Bizarrap", genre: "trapArgentino", tier: "tier1" },
  { artist: "YSY A", genre: "trapArgentino", tier: "tier1" },
  { artist: "Nicki Nicole", genre: "trapArgentino", tier: "tier1" },
  { artist: "Khea", genre: "trapArgentino", tier: "tier1" },
  { artist: "Neo Pistea", genre: "trapArgentino", tier: "tier1" },
  { artist: "Lit Killah", genre: "trapArgentino", tier: "tier1" },
  { artist: "Paulo Londra", genre: "trapArgentino", tier: "tier1" },
  { artist: "Papo MC", genre: "trapArgentino", tier: "tier1" },
  { artist: "Replik", genre: "trapArgentino", tier: "tier1" },
  { artist: "Wos", genre: "trapArgentino", tier: "tier1" },
  { artist: "FMK", genre: "trapArgentino", tier: "tier1" },
  { artist: "Rusherking", genre: "trapArgentino", tier: "tier1" },
  { artist: "Seven Kayne", genre: "trapArgentino", tier: "tier1" },
  { artist: "Milo J", genre: "trapArgentino", tier: "tier1" },
  { artist: "Sebastián Yatra", genre: "popLatinoActual", tier: "tier1" },
  { artist: "Kany García", genre: "popLatinoActual", tier: "tier1" },
  { artist: "Anahí", genre: "popLatinoActual", tier: "tier1" },
  { artist: "Samo", genre: "popLatinoActual", tier: "tier1" },
  { artist: "Leonel García", genre: "popLatinoActual", tier: "tier1" },
  { artist: "Fanny Lu", genre: "popLatinoActual", tier: "tier1" },
  { artist: "Sharon Corr (colab latinas)", genre: "popLatinoActual", tier: "tier1" },
  { artist: "Piso 21", genre: "popLatinoActual", tier: "tier1" },
  { artist: "Greeicy", genre: "popLatinoActual", tier: "tier1" },
  { artist: "Gloria Trevi", genre: "popLatinoActual", tier: "tier1" },
  { artist: "Pedro Capó", genre: "popLatinoActual", tier: "tier1" },
  { artist: "Alex Ubago", genre: "popLatinoActual", tier: "tier1" },
  { artist: "Danny Ocean", genre: "popLatinoActual", tier: "tier1" },
  { artist: "Caifanes", genre: "rockLatino", tier: "tier1" },
  { artist: "Héroes del Silencio", genre: "rockLatino", tier: "tier1" },
  { artist: "Café Tacuba", genre: "rockLatino", tier: "tier1" },
  { artist: "Los Bunkers", genre: "rockLatino", tier: "tier1" },
  { artist: "Vicentico", genre: "rockLatino", tier: "tier1" },
  { artist: "Lady Gaga", genre: "pop", tier: "tier1" },
  { artist: "Christina Aguilera", genre: "pop", tier: "tier1" },
  { artist: "Benny Blanco", genre: "pop", tier: "tier1" },
  { artist: "The Beach Boys", genre: "pop", tier: "tier1" },
  { artist: "Lana Del Rey", genre: "pop", tier: "tier1" },
  { artist: "Björk", genre: "pop", tier: "tier1" },
  { artist: "Rosalía", genre: "pop", tier: "tier1" },
  { artist: "Sam Smith", genre: "pop", tier: "tier1" },
  { artist: "Zoe Gotusso", genre: "pop", tier: "tier1" },
  { artist: "El Kuelgue", genre: "pop", tier: "tier1" },
  { artist: "Usted Señálemelo", genre: "pop", tier: "tier1" },
  { artist: "Denise Rosenthal", genre: "pop", tier: "tier1" },
  { artist: "Francisca Valenzuela", genre: "pop", tier: "tier1" },
  { artist: "Camila", genre: "pop", tier: "tier1" },
  { artist: "BTS", genre: "kpop", tier: "tier1" },
  { artist: "TWICE", genre: "kpop", tier: "tier1" },
  { artist: "ITZY", genre: "kpop", tier: "tier1" },
  { artist: "Girls' Generation", genre: "kpop", tier: "tier1" },
  { artist: "2NE1", genre: "kpop", tier: "tier1" },
  { artist: "LE SSERAFIM", genre: "kpop", tier: "tier1" },
  { artist: "NewJeans", genre: "kpop", tier: "tier1" },
  { artist: "NAYEON", genre: "kpop", tier: "tier1" },
  { artist: "María Becerra", genre: "urbanoLatino", tier: "tier1" },
  { artist: "Rels B", genre: "urbanoLatino", tier: "tier1" },
  { artist: "Nathy Peluso", genre: "urbanoLatino", tier: "tier1" },
  { artist: "Big One", genre: "urbanoLatino", tier: "tier1" },
  { artist: "Gente de Zona", genre: "urbanoLatino", tier: "tier1" },
  { artist: "Manuel Turizo", genre: "urbanoLatino", tier: "tier1" },
  { artist: "Kevvo", genre: "urbanoLatino", tier: "tier1" },
];

async function autoSearchMissingArtists() {
  try {
    console.log('================================================================================');
    console.log('🤖 BÚSQUEDA AUTOMÁTICA - ARTISTAS CON 0 CANCIONES');
    console.log('================================================================================\n');
    console.log(`📊 Total de artistas a buscar: ${artistsWithZeroSongs.length}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < artistsWithZeroSongs.length; i++) {
      const { artist, genre, tier } = artistsWithZeroSongs[i];

      console.log(`\n[${i + 1}/${artistsWithZeroSongs.length}] Buscando: "${artist}" (${genre} - ${tier})`);

      const results = await searchArtist(artist);

      if (results) {
        console.log(`   ✅ Búsqueda completada - ${results.length || 0} resultados encontrados`);
        successCount++;
      } else {
        console.log(`   ❌ Error en la búsqueda`);
        errorCount++;
      }

      // Esperar 5 segundos antes de la siguiente búsqueda
      if (i < artistsWithZeroSongs.length - 1) {
        console.log(`   ⏳ Esperando 5 segundos...`);
        await sleep(5000);
      }
    }

    console.log('\n\n================================================================================');
    console.log('📊 RESUMEN FINAL');
    console.log('================================================================================');
    console.log(`Total artistas buscados: ${artistsWithZeroSongs.length}`);
    console.log(`✅ Búsquedas exitosas: ${successCount}`);
    console.log(`❌ Búsquedas con error: ${errorCount}`);
    console.log('================================================================================\n');

    console.log('✅ Proceso completado');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

autoSearchMissingArtists();
