const { DataSource } = require('typeorm');
require('dotenv').config({ path: '/home/crigca/vibra/back/api/.env' });

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

// Patrones a limpiar del título
const PATTERNS_TO_REMOVE = [
  // Videos oficiales (combinaciones con calidad) - con espacios flexibles
  /\(\s*Official\s+HD\s+Video\s*\)/gi,
  /\(\s*Official\s+HQ\s+Video\s*\)/gi,
  /\(\s*Official\s+4K\s+Video\s*\)/gi,
  /\[\s*Official\s+HD\s+Video\s*\]/gi,
  /\[\s*Official\s+HQ\s+Video\s*\]/gi,
  /\[\s*Official\s+4K\s+Video\s*\]/gi,
  /\(\s*Video\s+Oficial\s*\)/gi,
  /\[\s*Video\s+Oficial\s*\]/gi,
  /\(\s*Vídeo\s+Oficial\s*\)/gi,
  /\[\s*Vídeo\s+Oficial\s*\]/gi,
  /[-–]\s*Video Oficial$/gi,
  /[-–]\s*Vídeo Oficial$/gi,
  /\(\s*Audio\s+Oficial\s*\)/gi,
  /\[\s*Audio\s+Oficial\s*\]/gi,
  /[-–]\s*Audio Oficial$/gi,

  // Videos oficiales - con espacios flexibles
  /\(\s*Official\s+Music\s+Video\s*\)/gi,
  /\(\s*Official\s+Video\s*\)/gi,
  /\(\s*Official\s+Audio\s*\)/gi,
  /[-–]\s*Official Audio$/gi,
  /[-–]\s*Official Video$/gi,
  /[-–]\s*Official Music Video$/gi,
  /\(\s*Lyric\s+Video\s*\)/gi,
  /\(\s*Lyrics\s*\)/gi,
  /\(\s*Audio\s*\)/gi,
  /\(\s*Video\s*\)/gi,
  /\(\s*Official\s*\)/gi,
  /\[\s*Official\s+Music\s+Video\s*\]/gi,
  /\[\s*Official\s+Video\s*\]/gi,
  /\[\s*Official\s+Audio\s*\]/gi,
  /\[\s*Lyric\s+Video\s*\]/gi,
  /\[\s*Lyrics\s*\]/gi,
  /\[\s*Audio\s*\]/gi,
  /\[\s*Video\s*\]/gi,
  /\[\s*Official\s*\]/gi,

  // Versiones y grabaciones
  /\(Live\)/gi,
  /\[Live\]/gi,
  /\(En Vivo\)/gi,
  /\[En Vivo\]/gi,
  /\(Acoustic\)/gi,
  /\[Acoustic\]/gi,
  /\(Remix\)/gi,
  /\[Remix\]/gi,

  // Años entre corchetes o paréntesis
  /\[\d{4}\]/g, // [2011], [2020], etc.
  /\(\d{4}\)/g, // (2011), (2020), etc.

  // Géneros musicales con años (al final del título)
  /[-–]\s*\w+\s+\d{4}\s*\/\s*\w+\s+\d{4}$/gi, // - REGGAETON 2018 / CUBATON 2018
  /[-–]\s*\w+\s+\d{4}$/gi, // - REGGAETON 2018

  // Traducciones
  /\(traducida al español\)/gi,
  /\[traducida al español\]/gi,
  /\(español\)/gi,
  /\[español\]/gi,
  /\(spanish\)/gi,
  /\[spanish\]/gi,
  /\(en español\)/gi,
  /\[en español\]/gi,
  /\(sub español\)/gi,
  /\[sub español\]/gi,
  /\(subtitulado\)/gi,
  /\[subtitulado\]/gi,
  /\(subtitulada\)/gi,
  /\[subtitulada\]/gi,
  /\(con subtítulos\)/gi,
  /\[con subtítulos\]/gi,

  // Palabras entre comillas
  /"[^"]*"/g, // "Estudio", "En Vivo", etc.
  /'[^']*'/g, // 'Estudio', 'En Vivo', etc.

  // Otros patrones
  /- Topic$/gi,
  /【.*?】/g, // Corchetes japoneses
  /「.*?」/g, // Comillas japonesas

  // Calidad de video
  /\(HD\)/gi,
  /\[HD\]/gi,
  /\(4K\)/gi,
  /\[4K\]/gi,
  /\(HQ\)/gi,
  /\[HQ\]/gi,
  /\[HD UPGRADE\]/gi,
  /\(HD UPGRADE\)/gi,
  /\[REMASTER\]/gi,
  /\(REMASTER\)/gi,
  /\[REMASTERED\]/gi,
  /\(REMASTERED\)/gi,
];

/**
 * Elimina todos los emojis de un texto
 */
function removeEmojis(text) {
  if (!text) return text;

  // Patrón para eliminar emojis (Unicode ranges)
  return text.replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Variation Selectors
    .replace(/[\u{200D}]/gu, '') // Zero Width Joiner
    .trim();
}

/**
 * Decodifica HTML entities
 */
function decodeHtmlEntities(text) {
  if (!text) return text;

  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(dec));
}

/**
 * Limpia el nombre del artista eliminando sufijos VEVO, Topic, emojis, HTML entities, etc.
 */
function cleanArtist(artist) {
  if (!artist) return artist;

  let cleaned = artist;

  // 1. Decodificar HTML entities (&amp; → &, etc.)
  cleaned = decodeHtmlEntities(cleaned);

  // 2. Eliminar emojis
  cleaned = removeEmojis(cleaned);

  // 3. Eliminar sufijos comunes de canales oficiales
  cleaned = cleaned
    .replace(/VEVO$/i, '') // "ShakiraVEVO" -> "Shakira"
    .replace(/\s*-\s*Topic$/i, '') // "Shakira - Topic" -> "Shakira"
    .replace(/Official$/i, '') // "ShakiraOfficial" -> "Shakira"
    .trim();

  // 4. Agregar espacio entre palabras sin espacios (camelCase)
  // "SodaStereo" -> "Soda Stereo"
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2');

  // 5. Limpiar espacios múltiples
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Limpia el título eliminando información redundante, emojis, HTML entities
 */
function cleanTitle(title, artist, cleanedArtist) {
  let cleaned = title;

  // 1. Decodificar HTML entities (&amp; → &, etc.)
  cleaned = decodeHtmlEntities(cleaned);

  // 2. Eliminar emojis
  cleaned = removeEmojis(cleaned);

  // 3. Si hay separador | (pipe), tomar solo la parte después del pipe
  // Ej: "NUEVAYoL (Video Oficial) | DeBÍ TiRAR MáS FOToS" -> "DeBÍ TiRAR MáS FOToS"
  if (cleaned.includes('|')) {
    const parts = cleaned.split('|');
    // Tomar la última parte (suele ser el título real)
    cleaned = parts[parts.length - 1].trim();
  }

  // 4. Eliminar el nombre del artista del inicio si está duplicado
  // Intentar primero con el artista limpio, luego con el original
  if (cleanedArtist) {
    const artistPattern = new RegExp(`^${escapeRegex(cleanedArtist)}\\s*[-–—:]\\s*`, 'i');
    cleaned = cleaned.replace(artistPattern, '');
  }
  if (artist && cleaned === title) {
    const artistPattern = new RegExp(`^${escapeRegex(artist)}\\s*[-–—:]\\s*`, 'i');
    cleaned = cleaned.replace(artistPattern, '');
  }

  // 5. Eliminar patrones comunes (Official Video, Lyrics, etc.)
  PATTERNS_TO_REMOVE.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // 6. Limpiar espacios extra y guiones finales
  cleaned = cleaned
    .replace(/\s+/g, ' ') // Múltiples espacios -> un espacio
    .replace(/\s*[-–—:]\s*$/g, '') // Guiones finales
    .replace(/^\s*[-–—:]\s*/g, '') // Guiones iniciales
    .trim();

  return cleaned;
}

/**
 * Escapa caracteres especiales de regex
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Analiza y muestra canciones que necesitan limpieza
 */
async function analyzeTitles() {
  console.log('🔍 Analizando títulos y artistas que necesitan limpieza...\n');

  // Obtener TODAS las canciones sin límite
  const songs = await dataSource.query(`
    SELECT id, title, artist
    FROM songs
    ORDER BY "createdAt" DESC
  `);

  const needsCleaning = [];

  for (const song of songs) {
    const cleanedArtist = cleanArtist(song.artist);
    const cleanedTitle = cleanTitle(song.title, song.artist, cleanedArtist);

    // Si el título o el artista cambió, necesita limpieza
    if (cleanedTitle !== song.title || cleanedArtist !== song.artist) {
      needsCleaning.push({
        id: song.id,
        oldArtist: song.artist,
        newArtist: cleanedArtist,
        oldTitle: song.title,
        newTitle: cleanedTitle,
        artistChanged: cleanedArtist !== song.artist,
        titleChanged: cleanedTitle !== song.title,
      });
    }
  }

  return needsCleaning;
}

/**
 * Actualiza los títulos y artistas en la base de datos
 */
async function updateTitles(songs) {
  console.log(`\n🔧 Actualizando ${songs.length} canciones...\n`);

  let updated = 0;
  let errors = 0;

  for (const song of songs) {
    try {
      await dataSource.query(
        `UPDATE songs SET title = $1, artist = $2, "updatedAt" = NOW() WHERE id = $3`,
        [song.newTitle, song.newArtist, song.id]
      );

      console.log(`✅ [${updated + 1}/${songs.length}] Actualizado`);

      if (song.artistChanged) {
        console.log(`   Artista: "${song.oldArtist}" → "${song.newArtist}"`);
      }

      if (song.titleChanged) {
        console.log(`   Título: "${song.oldTitle}" → "${song.newTitle}"`);
      }

      console.log('');

      updated++;
    } catch (error) {
      console.error(`❌ Error actualizando "${song.oldTitle}":`, error.message);
      errors++;
    }
  }

  return { updated, errors };
}

/**
 * Ejecutar limpieza
 */
async function main() {
  console.log('🎵 LIMPIEZA DE TÍTULOS DUPLICADOS');
  console.log('==================================\n');

  try {
    // Conectar a la base de datos
    console.log('🔌 Conectando a Railway PostgreSQL...');
    await dataSource.initialize();
    console.log('✅ Conectado a Railway\n');

    // Analizar títulos
    const songsToClean = await analyzeTitles();

    if (songsToClean.length === 0) {
      console.log('✨ ¡No hay títulos que necesiten limpieza!');
      await dataSource.destroy();
      return;
    }

    console.log('\n📊 RESUMEN DEL ANÁLISIS');
    console.log('========================');

    // Contar total de canciones en la DB
    const totalCount = await dataSource.query(`SELECT COUNT(*) as count FROM songs`);
    console.log(`Total de canciones analizadas: ${totalCount[0].count}`);
    console.log(`Canciones que necesitan limpieza: ${songsToClean.length}`);
    console.log(`  - Solo título: ${songsToClean.filter(s => s.titleChanged && !s.artistChanged).length}`);
    console.log(`  - Solo artista: ${songsToClean.filter(s => !s.titleChanged && s.artistChanged).length}`);
    console.log(`  - Ambos: ${songsToClean.filter(s => s.titleChanged && s.artistChanged).length}\n`);

    // Mostrar primeros 10 ejemplos
    console.log('📝 EJEMPLOS DE CAMBIOS (primeros 10):');
    console.log('======================================');
    songsToClean.slice(0, 10).forEach((song, index) => {
      console.log(`\n${index + 1}.`);
      if (song.artistChanged) {
        console.log(`   Artista ANTES: "${song.oldArtist}"`);
        console.log(`   Artista DESPUÉS: "${song.newArtist}"`);
      }
      if (song.titleChanged) {
        console.log(`   Título ANTES: "${song.oldTitle}"`);
        console.log(`   Título DESPUÉS: "${song.newTitle}"`);
      }
    });

    // Preguntar confirmación (en producción podrías comentar esto)
    console.log('\n\n⚠️  ¿Deseas continuar con la actualización? (Ctrl+C para cancelar)');
    console.log('Esperando 5 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Actualizar títulos
    const { updated, errors } = await updateTitles(songsToClean);

    // Resumen final
    console.log('\n\n📊 RESUMEN FINAL');
    console.log('================');
    console.log(`Títulos actualizados: ${updated}`);
    console.log(`Errores: ${errors}`);

    if (updated > 0) {
      console.log('\n✅ ¡Limpieza completada exitosamente!');
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
