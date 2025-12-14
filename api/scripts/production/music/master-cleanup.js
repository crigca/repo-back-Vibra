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
// ESTADÍSTICAS GLOBALES
// =====================
const stats = {
  total: 0,
  phase1: {
    genresAssigned: 0,
    genresOtros: 0,
    errors: 0
  },
  phase2: {
    titlesClean: 0,
    artistsClean: 0,
    errors: 0
  },
  phase3: {
    artistsNormalized: 0,
    errors: 0
  },
  phase4: {
    groupsAnalyzed: 0,
    duplicatesRemoved: 0,
    duplicatesKept: 0,
    errors: 0
  }
};

const uncategorizedSongs = [];

// =====================
// NORMALIZACIÓN
// =====================

/**
 * Normaliza un string para comparación
 * "Bad Bunny" → "badbunny"
 * "The Beatles" → "beatles"
 */
function normalizeString(str) {
  if (!str) return '';

  return str
    .toLowerCase()
    .normalize('NFD') // Descomponer acentos
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]/g, '') // Solo letras y números
    .trim();
}

/**
 * Normaliza un título para detección AGRESIVA de duplicados
 * Quita todo lo que está entre paréntesis, corchetes, y después de guiones
 * "Tu Eres Su Seguridad (Acústico)" → "tueressuseguridad"
 * "Tu Eres Su Seguridad - Vorterix" → "tueressuseguridad"
 * "05 - Tu Eres Su Seguridad" → "tueressuseguridad"
 */
function normalizeTitleForDuplicates(title) {
  if (!title) return '';

  let cleaned = title
    // Quitar contenido entre paréntesis
    .replace(/\([^)]*\)/g, '')
    // Quitar contenido entre corchetes
    .replace(/\[[^\]]*\]/g, '')
    // Quitar todo después de " - " (guión con espacios)
    .replace(/\s+-\s+.*$/, '')
    // Quitar todo después de " – " (guión largo)
    .replace(/\s+–\s+.*$/, '')
    // Quitar prefijos como "05 - "
    .replace(/^\d+\s*[-–]\s*/, '')
    // Quitar hashtags
    .replace(/#\w+/g, '')
    .trim();

  return normalizeString(cleaned);
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
 * Crea un mapa: artista normalizado → nombre canónico
 * Ejemplo: "malon" → "Malón"
 */
function createCanonicalArtistMap() {
  const map = new Map();

  for (const [genre, artists] of Object.entries(artistsByGenre)) {
    for (const artist of artists) {
      const normalized = normalizeString(artist);
      // Solo guardar el primero (el canónico)
      if (!map.has(normalized)) {
        map.set(normalized, artist);
      }
    }
  }

  console.log(`📋 Mapa de artistas canónicos creado: ${map.size} artistas\n`);
  return map;
}

const canonicalArtistMap = createCanonicalArtistMap();

/**
 * Obtiene el nombre canónico de un artista
 * Solo normaliza artistas que están en artists-data.js
 */
function getCanonicalArtist(artist) {
  if (!artist) return artist;
  const normalized = normalizeString(artist);
  return canonicalArtistMap.get(normalized) || artist; // Si no está en el mapa, devolver original
}

/**
 * Detecta el género de un artista
 */
function detectGenre(artist) {
  if (!artist) return null;

  const normalized = normalizeString(artist);
  return artistGenreMap.get(normalized) || null;
}

// =====================
// LIMPIEZA DE TÍTULOS
// =====================

const PATTERNS_TO_REMOVE = [
  // ============================================
  // PATRONES NUEVOS REQUERIDOS (más agresivos)
  // ============================================

  // "videoclip oficial" en cualquier formato
  /videoclip\s+oficial/gi,
  /vídeo\s*clip\s+oficial/gi,
  /video\s*clip\s+oficial/gi,
  /\(\s*videoclip\s+oficial\s*\)/gi,
  /\[\s*videoclip\s+oficial\s*\]/gi,
  /[-–]\s*videoclip\s+oficial/gi,

  // "topic" en cualquier posición
  /\btopic\b/gi,
  /\(\s*topic\s*\)/gi,
  /\[\s*topic\s*\]/gi,
  /[-–]\s*topic/gi,

  // "music video" en cualquier formato
  /\bmusic\s+video\b/gi,
  /\(\s*music\s+video\s*\)/gi,
  /\[\s*music\s+video\s*\]/gi,
  /[-–]\s*music\s+video/gi,

  // "lyric video" en cualquier formato
  /\blyric\s+video\b/gi,
  /\blyrics\s+video\b/gi,
  /\bvideo\s+lyric\b/gi, // Orden inverso
  /\(\s*lyric\s+video\s*\)/gi,
  /\(\s*video\s+lyric\s*\)/gi, // Orden inverso
  /\[\s*lyric\s+video\s*\]/gi,
  /\[\s*video\s+lyric\s*\]/gi, // Orden inverso
  /[-–]\s*lyric\s+video/gi,
  /[-–]\s*video\s+lyric/gi, // Orden inverso

  // "official lyric video" en cualquier formato
  /\bofficial\s+lyric\s+video\b/gi,
  /\bofficial\s+lyrics\s+video\b/gi,
  /\(\s*official\s+lyric\s+video\s*\)/gi,
  /\[\s*official\s+lyric\s+video\s*\]/gi,
  /[-–]\s*official\s+lyric\s+video/gi,

  // "with lyrics" / "whit lyrics" (typo común)
  /\bwith\s+lyrics\b/gi,
  /\bwhit\s+lyrics\b/gi, // typo común
  /\(\s*with\s+lyrics\s*\)/gi,
  /\[\s*with\s+lyrics\s*\]/gi,
  /[-–]\s*with\s+lyrics/gi,
  /\(\s*whit\s+lyrics\s*\)/gi,
  /\[\s*whit\s+lyrics\s*\]/gi,
  /[-–]\s*whit\s+lyrics/gi,

  // "subtitulos" / "con subtitulos" / "subtítulos" / "con subtítulos"
  /\bsubtitulos\b/gi,
  /\bsubtítulos\b/gi,
  /\bcon\s+subtitulos\b/gi,
  /\bcon\s+subtítulos\b/gi,
  /\(\s*subtitulos\s*\)/gi,
  /\[\s*subtitulos\s*\]/gi,
  /[-–]\s*subtitulos/gi,
  /\(\s*subtítulos\s*\)/gi,
  /\[\s*subtítulos\s*\]/gi,
  /[-–]\s*subtítulos/gi,
  /\(\s*con\s+subtitulos\s*\)/gi,
  /\[\s*con\s+subtitulos\s*\]/gi,
  /[-–]\s*con\s+subtitulos/gi,
  /\(\s*con\s+subtítulos\s*\)/gi,
  /\[\s*con\s+subtítulos\s*\]/gi,
  /[-–]\s*con\s+subtítulos/gi,

  // "rare video" en cualquier formato
  /\brare\s+video\b/gi,
  /\(\s*rare\s+video\s*\)/gi,
  /\[\s*rare\s+video\s*\]/gi,
  /[-–]\s*rare\s+video/gi,

  // "video musical" en cualquier formato
  /\bvideo\s+musical\b/gi,
  /\(\s*video\s+musical\s*\)/gi,
  /\[\s*video\s+musical\s*\]/gi,
  /[-–]\s*video\s+musical/gi,

  // "youtube" en cualquier posición
  /\byoutube\b/gi,
  /\(\s*youtube\s*\)/gi,
  /\[\s*youtube\s*\]/gi,
  /[-–]\s*youtube/gi,

  // "official music" en cualquier formato
  /\bofficial\s+music\b/gi,
  /\(\s*official\s+music\s*\)/gi,
  /\[\s*official\s+music\s*\]/gi,
  /[-–]\s*official\s+music/gi,

  // Calidades de video: HD, 4K, Full HD (standalone)
  /\bhd\b/gi,
  /\b4k\b/gi,
  /\bfull\s+hd\b/gi,
  /\bhq\b/gi, // High Quality
  /\(\s*hd\s*\)/gi,
  /\[\s*hd\s*\]/gi,
  /[-–]\s*hd/gi,
  /\(\s*4k\s*\)/gi,
  /\[\s*4k\s*\]/gi,
  /[-–]\s*4k/gi,
  /\(\s*full\s+hd\s*\)/gi,
  /\[\s*full\s+hd\s*\]/gi,
  /[-–]\s*full\s+hd/gi,
  /\(\s*hq\s*\)/gi,
  /\[\s*hq\s*\]/gi,
  /[-–]\s*hq/gi,

  // "upgrade" / "hd upgrade" en cualquier formato
  /\bhd\s+upgrade\b/gi,
  /\bupgrade\b/gi,
  /\(\s*upgrade\s*\)/gi,
  /\[\s*upgrade\s*\]/gi,
  /[-–]\s*upgrade/gi,
  /\(\s*hd\s+upgrade\s*\)/gi,
  /\[\s*hd\s+upgrade\s*\]/gi,
  /[-–]\s*hd\s+upgrade/gi,

  // "oficial" en cualquier formato (español)
  /\boficial\b/gi,
  /\(\s*oficial\s*\)/gi,
  /\[\s*oficial\s*\]/gi,
  /[-–]\s*oficial/gi,

  // ============================================
  // PATRONES ORIGINALES (mantenidos)
  // ============================================

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
  /\[Remix\)/gi,

  // Versiones alternativas, remasters y upscaled
  /\(alt\.?\s+version\)/gi,
  /\[alt\.?\s+version\]/gi,
  /\(alternative\s+version\)/gi,
  /\[alternative\s+version\]/gi,
  /\(.*?remastered.*?\)/gi, // Cualquier cosa con "remastered" entre paréntesis
  /\[.*?remastered.*?\]/gi, // Cualquier cosa con "remastered" entre corchetes
  /\(upscaled\s+version\)/gi,
  /\[upscaled\s+version\]/gi,
  /\(\d+\s+upscaled\s+version\)/gi, // Con año: (2021 Upscaled Version)
  /\[\d+\s+upscaled\s+version\]/gi,
  /\(studio\s+version\)/gi,
  /\[studio\s+version\]/gi,
  /\(album\s+version\)/gi,
  /\[album\s+version\]/gi,
  /\(single\s+version\)/gi,
  /\[single\s+version\]/gi,

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

  // Extensiones de archivo
  /\.wmv$/gi,
  /\.mp4$/gi,
  /\.avi$/gi,
  /\.flv$/gi,
  /\.mov$/gi,

  // Usuarios y canales de YouTube (metadata de videos)
  /video\s*\(\s*[a-z0-9_]+\s*\)/gi, // video ( username )
  /\(\s*[a-z0-9_]+\s*\)/gi, // ( username ) - solo lowercase con números/guiones

  // Shows de TV y programas con fechas
  /\(.*?tv\s+show.*?\)/gi,
  /\[.*?tv\s+show.*?\]/gi,
  /\(.*?show.*?\d{4}.*?\)/gi, // Shows con años
  /\[.*?show.*?\d{4}.*?\]/gi,

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
 * Escapa caracteres especiales de regex
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Limpia un título
 */
function cleanTitle(title, artist = '', cleanedArtist = '') {
  if (!title) return title;

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

  // 4. Normalizar paréntesis sin espacio antes (ejemplo: "title(text)" -> "title (text)")
  cleaned = cleaned.replace(/([^\s\(])(\()/g, '$1 $2');

  // 5. Eliminar el nombre del artista del inicio si está duplicado
  // Intentar primero con el artista limpio, luego con el original
  if (cleanedArtist) {
    const artistPattern = new RegExp(`^${escapeRegex(cleanedArtist)}\\s*[-–—:]\\s*`, 'i');
    cleaned = cleaned.replace(artistPattern, '');
  }
  if (artist && cleaned === title) {
    const artistPattern = new RegExp(`^${escapeRegex(artist)}\\s*[-–—:]\\s*`, 'i');
    cleaned = cleaned.replace(artistPattern, '');
  }

  // 6. Aplicar patrones de limpieza
  PATTERNS_TO_REMOVE.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // 7. Limpiar espacios extras
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/\s*[-–—:]\s*$/g, '')
    .replace(/^\s*[-–—:]\s*/g, '')
    .trim();

  return cleaned;
}

/**
 * Convierte un string a camelCase
 * "Luis Fonsi" -> "luisFonsi"
 * "AC/DC" -> "acDc"
 * "The Rolling Stones" -> "theRollingStones"
 */
function toCamelCase(str) {
  if (!str) return '';

  // Limpiar caracteres especiales pero preservar números
  let cleaned = str
    .trim()
    // Eliminar caracteres especiales excepto letras, números y espacios
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    // Normalizar espacios múltiples
    .replace(/\s+/g, ' ')
    .trim();

  // Si está vacío después de limpiar, usar el original sin espacios
  if (!cleaned) {
    cleaned = str.replace(/\s+/g, '');
  }

  // Dividir en palabras
  const words = cleaned.split(' ');

  // Convertir a camelCase
  const camelCase = words
    .map((word, index) => {
      if (!word) return '';

      // Primera palabra en minúscula
      if (index === 0) {
        return word.charAt(0).toLowerCase() + word.slice(1).toLowerCase();
      }

      // Resto de palabras: primera letra mayúscula
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');

  return camelCase || str.replace(/\s+/g, '').toLowerCase();
}

/**
 * Limpia el nombre del artista eliminando sufijos VEVO, Topic, emojis, HTML entities, etc.
 * Y convierte a camelCase para mantener consistencia en la DB
 */
function cleanArtist(artist) {
  if (!artist) return artist;

  let cleaned = artist;

  // 1. Decodificar HTML entities (&amp; → &, etc.)
  cleaned = decodeHtmlEntities(cleaned);

  // 2. Eliminar emojis
  cleaned = removeEmojis(cleaned);

  // 3. Aplicar TODOS los patrones de limpieza (igual que en títulos)
  PATTERNS_TO_REMOVE.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // 4. Eliminar sufijos comunes de canales oficiales
  cleaned = cleaned
    .replace(/VEVO$/i, '') // "ShakiraVEVO" -> "Shakira"
    .replace(/\s*-\s*Topic$/i, '') // "Shakira - Topic" -> "Shakira"
    .replace(/\s*Topic$/i, '') // "Shakira Topic" -> "Shakira"
    .replace(/Official$/i, '') // "ShakiraOfficial" -> "Shakira"
    .replace(/\s*-\s*Official$/i, '') // "Shakira - Official" -> "Shakira"
    .replace(/YouTube$/i, '') // "ShakiraYouTube" -> "Shakira"
    .replace(/\s*-\s*YouTube$/i, '') // "Shakira - YouTube" -> "Shakira"
    .trim();

  // 5. Agregar espacio entre palabras sin espacios (camelCase)
  // "SodaStereo" -> "Soda Stereo"
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2');

  // 6. Limpiar espacios múltiples
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 7. NO convertir a camelCase - dejar nombres legibles
  // "Luis Fonsi" -> "Luis Fonsi"
  // "The Rolling Stones" -> "The Rolling Stones"
  // cleaned = toCamelCase(cleaned); // DESHABILITADO

  return cleaned;
}

// =====================
// API FUNCTIONS
// =====================

async function getAllSongs() {
  try {
    console.log('📋 Obteniendo todas las canciones...\n');

    const totalResponse = await axios.get(`${API_BASE_URL}/music/songs/count`);
    const total = totalResponse.data.total;
    stats.total = total;

    console.log(`Total de canciones en DB: ${total}\n`);

    let allSongs = [];
    let offset = 0;
    const limit = 500;

    while (offset < total) {
      const response = await axios.get(`${API_BASE_URL}/music/songs/all-raw`, {
        params: { limit, offset }
      });

      allSongs = allSongs.concat(response.data);
      offset += limit;
      console.log(`Cargadas ${allSongs.length}/${total} canciones...`);
    }

    console.log(`\n✅ Total cargadas: ${allSongs.length} canciones\n`);
    return allSongs;

  } catch (error) {
    console.error('❌ Error obteniendo canciones:', error.message);
    return [];
  }
}

async function updateSong(songId, updates, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await axios.patch(`${API_BASE_URL}/music/songs/${songId}`, updates);
      return true;
    } catch (error) {
      if (error.response?.status === 429 && attempt < retries) {
        // Rate limited - esperar y reintentar
        const waitTime = 1000 * attempt; // 1s, 2s, 3s
        console.log(`⏳ Rate limit (429), esperando ${waitTime}ms antes de reintentar...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      console.error(`❌ Error actualizando canción ${songId}:`, error.message);
      return false;
    }
  }
  return false;
}

async function deleteSong(songId, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await axios.delete(`${API_BASE_URL}/music/songs/${songId}`);
      return true;
    } catch (error) {
      if (error.response?.status === 429 && attempt < retries) {
        // Rate limited - esperar y reintentar
        const waitTime = 1000 * attempt; // 1s, 2s, 3s
        console.log(`⏳ Rate limit (429), esperando ${waitTime}ms antes de reintentar...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      console.error(`❌ Error eliminando canción ${songId}:`, error.message);
      return false;
    }
  }
  return false;
}

// =====================
// FASE 1: ASIGNACIÓN DE GÉNEROS
// =====================

async function phase1AssignGenres(songs) {
  console.log('\n' + '='.repeat(70));
  console.log('FASE 1: ASIGNACIÓN DE GÉNEROS');
  console.log('='.repeat(70) + '\n');

  console.log('🔍 Detectando géneros para cada canción...\n');

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];

    // Si ya tiene género, skip
    if (song.genre && song.genre !== 'sin-categoria') {
      continue;
    }

    const detectedGenre = detectGenre(song.artist);

    if (detectedGenre) {
      // Género encontrado
      const success = await updateSong(song.id, { genre: detectedGenre });

      if (success) {
        console.log(`✅ [${i + 1}/${songs.length}] "${song.title}" → ${detectedGenre}`);
        stats.phase1.genresAssigned++;
        song.genre = detectedGenre; // Actualizar en memoria
      } else {
        stats.phase1.errors++;
      }
    } else {
      // Género NO encontrado → Asignar "sin-categoria" (CUARENTENA)
      const success = await updateSong(song.id, { genre: 'sin-categoria' });

      if (success) {
        console.log(`⚠️  [${i + 1}/${songs.length}] "${song.title}" por "${song.artist}" → sin-categoria (CUARENTENA)`);
        stats.phase1.genresOtros++;
        song.genre = 'sin-categoria';

        // Guardar para reporte
        uncategorizedSongs.push({
          id: song.id,
          title: song.title,
          artist: song.artist,
          youtubeId: song.youtubeId,
          viewCount: song.viewCount || 0
        });
      } else {
        stats.phase1.errors++;
      }
    }

    // Pausa para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log('\n✅ Fase 1 completada!\n');
}

// =====================
// FASE 2: LIMPIEZA DE TÍTULOS
// =====================

async function phase2CleanTitles(songs) {
  console.log('\n' + '='.repeat(70));
  console.log('FASE 2: LIMPIEZA DE TÍTULOS Y ARTISTAS');
  console.log('='.repeat(70) + '\n');

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];

    const cleanedArtist = cleanArtist(song.artist);
    const cleanedTitle = cleanTitle(song.title, song.artist, cleanedArtist);

    const titleChanged = cleanedTitle !== song.title;
    const artistChanged = cleanedArtist !== song.artist;

    if (titleChanged || artistChanged) {
      const updates = {};
      if (titleChanged) updates.title = cleanedTitle;
      if (artistChanged) updates.artist = cleanedArtist;

      const success = await updateSong(song.id, updates);

      if (success) {
        console.log(`🧹 [${i + 1}/${songs.length}] Limpiado:`);
        if (titleChanged) {
          console.log(`   Título: "${song.title}" → "${cleanedTitle}"`);
          stats.phase2.titlesClean++;
        }
        if (artistChanged) {
          console.log(`   Artista: "${song.artist}" → "${cleanedArtist}"`);
          stats.phase2.artistsClean++;
        }

        // Actualizar en memoria
        song.title = cleanedTitle;
        song.artist = cleanedArtist;
      } else {
        stats.phase2.errors++;
      }

      // Pausa para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  console.log('\n✅ Fase 2 completada!\n');
}

// =====================
// FASE 3: NORMALIZACIÓN DE ARTISTAS CANÓNICOS
// =====================

async function phase3NormalizeArtists(songs) {
  console.log('\n' + '='.repeat(70));
  console.log('FASE 3: NORMALIZACIÓN DE ARTISTAS CANÓNICOS');
  console.log('='.repeat(70) + '\n');

  console.log('🔍 Normalizando nombres de artistas usando artists-data.js...\n');

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    const canonicalArtist = getCanonicalArtist(song.artist);

    if (canonicalArtist !== song.artist) {
      const success = await updateSong(song.id, { artist: canonicalArtist });

      if (success) {
        console.log(`✅ [${i + 1}/${songs.length}] "${song.artist}" → "${canonicalArtist}"`);
        song.artist = canonicalArtist; // Actualizar en memoria
        stats.phase3.artistsNormalized++;
      } else {
        stats.phase3.errors++;
      }

      // Pausa para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  console.log('\n✅ Fase 3 completada!\n');
}

// =====================
// FASE 4: ELIMINACIÓN DE DUPLICADOS
// =====================

async function phase4RemoveDuplicates(songs) {
  console.log('\n' + '='.repeat(70));
  console.log('FASE 4: ELIMINACIÓN DE DUPLICADOS (Máximo 2 por título+artista)');
  console.log('='.repeat(70) + '\n');

  // Agrupar por título normalizado AGRESIVO + artista normalizado
  // Esto agrupa "Tu Eres Su Seguridad (Acústico)" con "Tu Eres Su Seguridad - Vorterix"
  const groups = new Map();

  for (const song of songs) {
    const titleNorm = normalizeTitleForDuplicates(song.title); // Usa normalización agresiva
    const artistNorm = normalizeString(song.artist);
    const key = titleNorm + '|||' + artistNorm;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(song);
  }

  console.log(`📊 Total de grupos analizados: ${groups.size}\n`);
  stats.phase4.groupsAnalyzed = groups.size;

  // Procesar grupos con 3 o más canciones
  for (const [, groupSongs] of groups) {
    if (groupSongs.length >= 3) {
      // Ordenar: priorizar las que tienen cloudinaryUrl, luego por viewCount
      groupSongs.sort((a, b) => {
        // Priorizar las que tienen cloudinaryUrl
        const aHasCloud = a.cloudinaryUrl ? 1 : 0;
        const bHasCloud = b.cloudinaryUrl ? 1 : 0;
        if (bHasCloud !== aHasCloud) return bHasCloud - aHasCloud;

        // Luego por viewCount
        return (b.viewCount || 0) - (a.viewCount || 0);
      });

      console.log(`\n🔍 Grupo con ${groupSongs.length} canciones:`);
      console.log(`   Título: "${groupSongs[0].title}"`);
      console.log(`   Artista: "${groupSongs[0].artist}"`);
      console.log('');

      // Mantener las 2 primeras
      const toKeep = groupSongs.slice(0, 2);
      const toDelete = groupSongs.slice(2);

      console.log(`   ✅ MANTENER (top 2):`);
      toKeep.forEach((song, i) => {
        const hasCloud = song.cloudinaryUrl ? 'SI' : 'NO';
        console.log(`      ${i + 1}. ${song.viewCount || 0} vistas, Cloudinary: ${hasCloud} - ID: ${song.id}`);
      });

      console.log(`   ❌ ELIMINAR (${toDelete.length} duplicados):`);
      for (const song of toDelete) {
        const hasCloud = song.cloudinaryUrl ? 'SI' : 'NO';
        console.log(`      - ${song.viewCount || 0} vistas, Cloudinary: ${hasCloud} - ID: ${song.id}`);

        const success = await deleteSong(song.id);
        if (success) {
          stats.phase4.duplicatesRemoved++;
        } else {
          stats.phase4.errors++;
        }

        // Pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      stats.phase4.duplicatesKept += 2;
    }
  }

  console.log('\n✅ Fase 4 completada!\n');
}

// =====================
// FASE 5: GENERACIÓN DE REPORTES
// =====================

function phase5GenerateReports() {
  console.log('\n' + '='.repeat(70));
  console.log('FASE 5: GENERACIÓN DE REPORTES');
  console.log('='.repeat(70) + '\n');

  // Reporte JSON
  const jsonReport = {
    timestamp: new Date().toISOString(),
    stats,
    uncategorizedSongs
  };

  const jsonPath = path.join(OUTPUT_DIR, 'cleanup-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
  console.log(`📄 Reporte JSON: ${jsonPath}`);

  // Reporte CSV de canciones sin categorizar
  if (uncategorizedSongs.length > 0) {
    const csvLines = [
      'ID,Título,Artista,YouTube ID,Vistas'
    ];

    uncategorizedSongs.forEach(song => {
      csvLines.push(`"${song.id}","${song.title}","${song.artist}","${song.youtubeId}",${song.viewCount}`);
    });

    const csvPath = path.join(OUTPUT_DIR, 'uncategorized-songs.csv');
    fs.writeFileSync(csvPath, csvLines.join('\n'));
    console.log(`📄 Reporte CSV: ${csvPath}`);
  }

  console.log('\n✅ Reportes generados!\n');
}

// =====================
// RESUMEN FINAL
// =====================

function printFinalSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(70) + '\n');

  console.log(`Total de canciones procesadas: ${stats.total}\n`);

  console.log('FASE 1: Asignación de Géneros');
  console.log(`  ✅ Géneros detectados y asignados: ${stats.phase1.genresAssigned}`);
  console.log(`  ⚠️  Asignadas a "sin-categoria" (CUARENTENA): ${stats.phase1.genresOtros}`);
  console.log(`  ❌ Errores: ${stats.phase1.errors}\n`);

  console.log('FASE 2: Limpieza de Títulos');
  console.log(`  ✅ Títulos limpiados: ${stats.phase2.titlesClean}`);
  console.log(`  ✅ Artistas limpiados: ${stats.phase2.artistsClean}`);
  console.log(`  ❌ Errores: ${stats.phase2.errors}\n`);

  console.log('FASE 3: Normalización de Artistas Canónicos');
  console.log(`  ✅ Artistas normalizados: ${stats.phase3.artistsNormalized}`);
  console.log(`  ❌ Errores: ${stats.phase3.errors}\n`);

  console.log('FASE 4: Eliminación de Duplicados');
  console.log(`  📊 Grupos analizados: ${stats.phase4.groupsAnalyzed}`);
  console.log(`  ✅ Canciones mantenidas (máx 2): ${stats.phase4.duplicatesKept}`);
  console.log(`  ❌ Duplicados eliminados: ${stats.phase4.duplicatesRemoved}`);
  console.log(`  ❌ Errores: ${stats.phase4.errors}\n`);

  if (uncategorizedSongs.length > 0) {
    console.log(`⚠️  ${uncategorizedSongs.length} canciones en CUARENTENA ("sin-categoria")`);
    console.log(`   Revisa manualmente y agrega artistas legítimos a artists-data.js`);
    console.log(`   Reporte CSV: ${OUTPUT_DIR}/uncategorized-songs.csv\n`);
  }

  console.log('✅ LIMPIEZA MAESTRA COMPLETADA!\n');
}

// =====================
// MAIN
// =====================

async function main() {
  console.log('\n🧹 LIMPIEZA MAESTRA DE BASE DE DATOS');
  console.log('=' .repeat(70));
  console.log('Este script realizará:');
  console.log('  1. Asignación automática de géneros');
  console.log('  2. Limpieza de títulos y artistas');
  console.log('  3. Normalización de artistas canónicos (Malon → Malón)');
  console.log('  4. Eliminación de duplicados (máximo 2 por título+artista)');
  console.log('  5. Generación de reportes');
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

  console.log('⚠️  ADVERTENCIA: Este script modificará la base de datos.');
  console.log('⚠️  Asegúrate de tener un backup si es necesario.\n');
  console.log('Esperando 5 segundos antes de continuar...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // Cargar todas las canciones
    const songs = await getAllSongs();

    if (songs.length === 0) {
      console.log('❌ No se encontraron canciones.');
      return;
    }

    // Ejecutar fases
    await phase1AssignGenres(songs);
    await phase2CleanTitles(songs);
    await phase3NormalizeArtists(songs);
    await phase4RemoveDuplicates(songs);
    phase5GenerateReports();

    // Resumen final
    printFinalSummary();

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
