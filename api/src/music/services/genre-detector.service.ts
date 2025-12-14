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
   * Si un artista está duplicado, se mantiene el PRIMER género encontrado.
   */
  private loadArtistData() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { artistsByGenre } = require('../../../scripts/data/artists-data.js');

      for (const [genre, artists] of Object.entries(artistsByGenre)) {
        for (const artist of artists as string[]) {
          const normalizedArtist = this.normalizeString(artist);
          // Solo agregar si no existe (protección anti-duplicados)
          if (!this.artistGenreMap.has(normalizedArtist)) {
            this.artistGenreMap.set(normalizedArtist, genre);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error al cargar artistas: ${error.message}`);
    }
  }

  /**
   * Detecta el género de una canción basándose ÚNICAMENTE en el artista
   * @param artist - Nombre del artista (puede incluir colaboraciones)
   * @param title - Título de la canción (no se usa, solo para logging)
   * @returns Género detectado en camelCase o null si no está en el JSON
   */
  detectGenre(artist: string, _title?: string): string | null {
    // 1. Primero intentar coincidencia exacta con el string completo
    const normalizedFull = this.normalizeString(artist);
    const genreExact = this.artistGenreMap.get(normalizedFull);
    if (genreExact) {
      this.logger.log(`🎵 Género detectado (exacto) para "${artist}": ${genreExact}`);
      return genreExact;
    }

    // 2. Extraer artistas individuales de colaboraciones
    const artists = this.extractArtists(artist);

    // 3. Buscar cada artista en el JSON (prioridad al primero que encuentre)
    for (const singleArtist of artists) {
      const normalizedArtist = this.normalizeString(singleArtist);
      const genreKey = this.artistGenreMap.get(normalizedArtist);
      if (genreKey) {
        this.logger.log(`🎵 Género detectado para "${singleArtist}" (de "${artist}"): ${genreKey}`);
        return genreKey;
      }
    }

    // Si ningún artista está en el JSON → cuarentena (null → sinCategoria)
    this.logger.warn(`⚠️ Artista "${artist}" no está en el JSON → va a cuarentena`);
    return null;
  }

  /**
   * Extrae artistas individuales de un string con colaboraciones
   * Ejemplo: "21 Savage & Metro Boomin" → ["21 Savage", "Metro Boomin"]
   * Ejemplo: "Charly García, Sting" → ["Charly García", "Sting"]
   */
  private extractArtists(artistString: string): string[] {
    // Separadores comunes en colaboraciones
    // Orden importante: primero los más específicos
    const separators = [
      ' feat. ',
      ' feat ',
      ' ft. ',
      ' ft ',
      ' featuring ',
      ' & ',
      ' x ',
      ' X ',
      ' y ',
      ' Y ',
      ', ',
      ' con ',
      ' Con ',
      ' vs ',
      ' vs. ',
    ];

    let artists = [artistString];

    // Dividir por cada separador
    for (const separator of separators) {
      const newArtists: string[] = [];
      for (const artist of artists) {
        if (artist.includes(separator)) {
          const parts = artist.split(separator).map(p => p.trim()).filter(p => p.length > 0);
          newArtists.push(...parts);
        } else {
          newArtists.push(artist);
        }
      }
      artists = newArtists;
    }

    // Limpiar y eliminar duplicados
    return [...new Set(artists.map(a => a.trim()).filter(a => a.length > 0))];
  }

  // ELIMINADO: detectGenreFromTitle - Solo el artista define el género

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
