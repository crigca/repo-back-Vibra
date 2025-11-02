import { Injectable, Logger } from '@nestjs/common';

/**
 * Servicio para detectar automáticamente el género de una canción
 * basándose en el artista o palabras clave en el título
 */
@Injectable()
export class GenreDetectorService {
  private readonly logger = new Logger(GenreDetectorService.name);

  // Mapa de artistas a géneros (cargado desde artists-data.js)
  private artistGenreMap: Map<string, string> = new Map();

  // Mapa inverso: de género normalizado a género original
  private genreNormalizationMap: Map<string, string> = new Map([
    // Rock y derivados
    ['rock', 'Rock'],
    ['rockargentino', 'Rock Argentino'],
    ['rocklatino', 'Rock Latino'],
    ['alternativerock', 'Alternative'],
    ['indierock', 'Alternative'],
    ['progressiverock', 'Rock'],
    ['softrock', 'Rock'],
    ['glamrock', 'Rock'],
    ['grunge', 'Rock'],

    // Metal
    ['metal', 'Metal'],
    ['heavymetal', 'Metal'],
    ['heavymetalargentino', 'Metal'],
    ['heavymetallatino', 'Metal'],
    ['thrashmetal', 'Metal'],
    ['deathmetal', 'Metal'],
    ['blackmetal', 'Metal'],
    ['industrialmetal', 'Metal'],
    ['glammetal', 'Metal'],

    // Pop
    ['pop', 'Pop'],
    ['pop90s', 'Pop'],
    ['poplatinoactual', 'Latin'],
    ['poplatinoClasico', 'Latin'],
    ['poppunk', 'Punk'],
    ['kpop', 'Pop'],
    ['jpop', 'Pop'],

    // Electrónica
    ['edm', 'Electronic'],
    ['edmactual', 'Electronic'],
    ['house', 'Electronic'],
    ['techno', 'Electronic'],
    ['trance', 'Electronic'],
    ['dubstep', 'Electronic'],
    ['drumandbass', 'Electronic'],
    ['lofi', 'Electronic'],
    ['synthpop', 'Electronic'],
    ['hyperpop', 'Electronic'],

    // Urbano
    ['reggaeton', 'Reggaeton'],
    ['trap', 'Urbano'],
    ['trapargentino', 'Urbano'],
    ['urbanolatino', 'Urbano'],
    ['hiphop', 'Hip-Hop'],
    ['rap', 'Hip-Hop'],
    ['drill', 'Urbano'],

    // Latina
    ['cumbia', 'Cumbia'],
    ['cumbia420', 'Cumbia'],
    ['cumbiavillera', 'Cumbia'],
    ['salsa', 'Salsa'],
    ['merengue', 'Latin'],
    ['bachata', 'Latin'],
    ['norteño', 'Regional Mexicano'],
    ['corrido', 'Regional Mexicano'],
    ['corridostumbados', 'Regional Mexicano'],
    ['mariachi', 'Regional Mexicano'],
    ['ranchera', 'Regional Mexicano'],
    ['balada', 'Balada'],
    ['bolero', 'Balada'],
    ['tango', 'Tango'],
    ['cuarteto', 'Cuarteto'],
    ['folkloreargentino', 'Folk'],

    // Otros
    ['jazz', 'Jazz'],
    ['blues', 'Blues'],
    ['soul', 'Soul'],
    ['funk', 'Funk'],
    ['disco', 'Disco'],
    ['reggae', 'Reggae'],
    ['dancehall', 'Reggae'],
    ['ska', 'Ska'],
    ['punk', 'Punk'],
    ['country', 'Country'],
    ['folk', 'Folk'],
    ['gospel', 'Gospel'],
    ['rb', 'R&B'],
    ['newwave', 'Rock'],
  ]);

  constructor() {
    this.loadArtistData();
    this.logger.log('✅ GenreDetectorService inicializado');
  }

  /**
   * Carga los datos de artistas desde el archivo artists-data.js
   */
  private loadArtistData() {
    try {
      // Cargar dinámicamente el archivo
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { artistsByGenre } = require('../../../scripts/data/artists-data.js');

      // Crear mapa artista -> género (normalizado)
      for (const [genre, artists] of Object.entries(artistsByGenre)) {
        for (const artist of artists as string[]) {
          // Normalizar nombre del artista (minúsculas, sin acentos)
          const normalizedArtist = this.normalizeString(artist);
          this.artistGenreMap.set(normalizedArtist, genre);
        }
      }

      this.logger.log(`📚 Cargados ${this.artistGenreMap.size} artistas con géneros asociados`);
    } catch (error) {
      this.logger.error(`❌ Error al cargar datos de artistas: ${error.message}`);
    }
  }

  /**
   * Detecta el género de una canción basándose en el artista y/o título
   * @param artist - Nombre del artista
   * @param title - Título de la canción (opcional, para palabras clave)
   * @returns Género detectado o 'Sin categoría' si no se puede determinar
   */
  detectGenre(artist: string, title?: string): string {
    // Normalizar artista
    const normalizedArtist = this.normalizeString(artist);

    // 1. Buscar por artista exacto
    const genreKey = this.artistGenreMap.get(normalizedArtist);
    if (genreKey) {
      const mappedGenre = this.genreNormalizationMap.get(genreKey.toLowerCase());
      const finalGenre = mappedGenre || this.capitalizeGenre(genreKey);
      this.logger.log(`🎵 Género detectado para "${artist}": ${finalGenre}`);
      return finalGenre;
    }

    // 2. Buscar por coincidencia parcial en el nombre del artista
    for (const [artistKey, genreKey] of this.artistGenreMap.entries()) {
      if (normalizedArtist.includes(artistKey) || artistKey.includes(normalizedArtist)) {
        const mappedGenre = this.genreNormalizationMap.get(genreKey.toLowerCase());
        const finalGenre = mappedGenre || this.capitalizeGenre(genreKey);
        this.logger.log(`🎵 Género detectado (parcial) para "${artist}": ${finalGenre}`);
        return finalGenre;
      }
    }

    // 3. Si no se encontró por artista, intentar detectar por palabras clave en el título
    if (title) {
      const genreFromTitle = this.detectGenreFromTitle(title);
      if (genreFromTitle !== 'Sin categoría') {
        this.logger.log(`🎵 Género detectado por título "${title}": ${genreFromTitle}`);
        return genreFromTitle;
      }
    }

    // 4. Si no se pudo detectar, devolver 'Sin categoría'
    this.logger.warn(`⚠️ No se pudo detectar género para "${artist}" - "${title || 'sin título'}"`);
    return 'Sin categoría';
  }

  /**
   * Intenta detectar el género basándose en palabras clave en el título
   */
  private detectGenreFromTitle(title: string): string {
    const normalizedTitle = this.normalizeString(title);

    // Palabras clave por género
    const keywordMap: { [key: string]: string[] } = {
      'Reggaeton': ['reggaeton', 'perreo', 'dembow'],
      'Cumbia': ['cumbia', 'sonidero'],
      'Salsa': ['salsa'],
      'Rock': ['rock'],
      'Metal': ['metal'],
      'Electronic': ['remix', 'mix', 'dj', 'edm'],
      'Hip-Hop': ['freestyle', 'cypher', 'rap'],
      'Balada': ['balada', 'romantica'],
    };

    for (const [genre, keywords] of Object.entries(keywordMap)) {
      if (keywords.some(keyword => normalizedTitle.includes(keyword))) {
        return genre;
      }
    }

    return 'Sin categoría';
  }

  /**
   * Normaliza un string: minúsculas, sin acentos, sin caracteres especiales
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9\s]/g, '') // Eliminar caracteres especiales
      .trim();
  }

  /**
   * Capitaliza el nombre de un género (primera letra mayúscula)
   */
  private capitalizeGenre(genre: string): string {
    // Convertir camelCase a espacios
    const withSpaces = genre.replace(/([A-Z])/g, ' $1').trim();
    // Capitalizar primera letra de cada palabra
    return withSpaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
