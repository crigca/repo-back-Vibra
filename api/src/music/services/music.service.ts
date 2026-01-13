import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Song } from '../entities/song.entity';
import { YoutubeService, YouTubeSearchResult } from './youtube.service';
import { GenreDetectorService } from './genre-detector.service';
import { SearchSongsDto } from '../dto/search-songs.dto';
import { CreateSongDto } from '../dto/create-song.dto';

// Servicio de música - maneja YouTube API y BD
@Injectable()
export class MusicService {
  private readonly logger = new Logger(MusicService.name);

  constructor(
    @InjectRepository(Song)
    private songRepository: Repository<Song>,
    private youtubeService: YoutubeService,
    private genreDetector: GenreDetectorService,
    private eventEmitter: EventEmitter2,
  ) {}

  // Busca canciones en YouTube
  async searchSongs(searchDto: SearchSongsDto): Promise<YouTubeSearchResult[]> {
    this.logger.log(
      `🔍 Buscando canciones: "${searchDto.query}" (max: ${searchDto.maxResults})`,
    );

    try {
      const results = await this.youtubeService.searchVideos(
        searchDto.query,
        searchDto.maxResults,
        searchDto.regionCode,
      );

      this.logger.log(
        `✅ Búsqueda completada: ${results.length} canciones encontradas`,
      );
      return results;
    } catch (error) {
      this.logger.error(`❌ Error en búsqueda: ${error.message}`);
      throw error;
    }
  }

  // Crea nueva canción en BD
  async createSong(createSongDto: CreateSongDto): Promise<Song> {
    this.logger.log(
      `💾 Guardando canción: "${createSongDto.title}" por ${createSongDto.artist}`,
    );

    // Verificar si ya existe por youtubeId
    const existingByYoutubeId = await this.songRepository.findOne({
      where: { youtubeId: createSongDto.youtubeId },
    });

    if (existingByYoutubeId) {
      this.logger.warn(
        `⚠️ Canción ya existe con youtubeId: ${createSongDto.youtubeId}`,
      );
      throw new ConflictException(
        `La canción con YouTube ID ${createSongDto.youtubeId} ya existe en la base de datos`,
      );
    }

    // Verificar si ya existe una canción con el mismo título y artista
    const existingByTitleArtist = await this.songRepository
      .createQueryBuilder('song')
      .where('LOWER(song.title) = LOWER(:title)', { title: createSongDto.title })
      .andWhere('LOWER(song.artist) = LOWER(:artist)', { artist: createSongDto.artist })
      .getOne();

    if (existingByTitleArtist) {
      this.logger.warn(
        `⚠️ Ya existe una canción con título "${createSongDto.title}" y artista "${createSongDto.artist}"`,
      );
      throw new ConflictException(
        `Ya existe una canción con el título "${createSongDto.title}" del artista "${createSongDto.artist}" en la base de datos`,
      );
    }

    try {
      // Detectar género automáticamente si no viene en el DTO
      let detectedGenre = createSongDto.genre;

      if (!detectedGenre) {
        this.logger.log(`🔍 Intentando detectar género automáticamente para "${createSongDto.artist}"...`);
        const genreFromDetector = this.genreDetector.detectGenre(
          createSongDto.artist,
          createSongDto.title
        );

        if (genreFromDetector) {
          detectedGenre = genreFromDetector;
          this.logger.log(`✅ Género detectado automáticamente: ${detectedGenre}`);
        } else {
          // Si no se detecta, guardar como "sinCategoria" para revisión manual
          detectedGenre = 'sinCategoria';
          this.logger.warn(`⚠️ No se pudo detectar género automáticamente - guardar como "sinCategoria" para revisión manual`);
        }
      }

      const songData = {
        ...createSongDto,
        genre: detectedGenre, // Siempre tiene un valor (detectado o "sinCategoria")
        publishedAt: createSongDto.publishedAt
          ? new Date(createSongDto.publishedAt)
          : undefined,
      };

      const song = this.songRepository.create(songData);

      const savedSong = await this.songRepository.save(song);

      this.logger.log(
        `✅ Canción guardada exitosamente con ID: ${savedSong.id} - Género: ${detectedGenre}`,
      );

      // Emitir evento
      this.eventEmitter.emit('song.created', { song: savedSong });

      return savedSong;
    } catch (error) {
      this.logger.error(`❌ Error al guardar canción: ${error.message}`);
      throw error;
    }
  }

  // Busca canción por ID
  async findSongById(id: string): Promise<Song> {
    const song = await this.songRepository.findOne({ where: { id } });

    if (!song) {
      throw new NotFoundException(`Canción con ID ${id} no encontrada`);
    }

    return song;
  }

  // Busca canción por YouTube ID
  async findSongByYoutubeId(youtubeId: string): Promise<Song | null> {
    this.logger.log(`🔍 Buscando canción por YouTube ID: ${youtubeId}`);

    const song = await this.songRepository.findOne({ where: { youtubeId } });

    if (song) {
      this.logger.log(`✅ Canción encontrada: "${song.title}"`);
    } else {
      this.logger.log(`ℹ️ No se encontró canción con YouTube ID: ${youtubeId}`);
    }

    return song;
  }

  // Pausa reproducción
  async pauseSong(): Promise<void> {
    this.logger.log('⏸️ Reproducción pausada');

    // Emitir evento
    this.eventEmitter.emit('song.paused', {
      timestamp: new Date(),
    });
  }

  // Obtiene canciones con paginación (SOLO las que tienen audio)
  async getAllSongs(limit: number = 50, offset: number = 0): Promise<Song[]> {
    this.logger.log(
      `📋 Obteniendo ${limit} canciones con audio (offset: ${offset})`,
    );

    const songs = await this.songRepository
      .createQueryBuilder('song')
      .where('song.storage_url IS NOT NULL')
      .andWhere('song.genre IS NOT NULL')
      .andWhere("song.genre != ''")
      .orderBy('song.id', 'ASC')
      .skip(offset)
      .take(limit)
      .getMany();

    this.logger.log(`✅ Obtenidas ${songs.length} canciones (offset: ${offset})`);
    return songs;
  }

  // Obtiene canciones ALEATORIAS (para Descubre Nueva Música)
  // EXCLUYE canciones en cuarentena (sinCategoria)
  async getRandomSongs(limit: number = 25): Promise<Song[]> {
    this.logger.log(`🎲 Obteniendo ${limit} canciones aleatorias (excluyendo cuarentena)`);

    const songs = await this.songRepository
      .createQueryBuilder('song')
      .where('song.storage_url IS NOT NULL')
      .andWhere('song.genre IS NOT NULL')
      .andWhere("song.genre != ''")
      .andWhere("song.genre != 'sinCategoria'") // Excluir canciones en cuarentena
      .orderBy('RANDOM()')
      .take(limit)
      .getMany();

    this.logger.log(`✅ Obtenidas ${songs.length} canciones aleatorias`);
    return songs;
  }

  // Cuenta total de canciones
  async getTotalSongsCount(): Promise<number> {
    const count = await this.songRepository.count();
    this.logger.log(`📊 Total de canciones en BD: ${count}`);
    return count;
  }

  // Obtener TODAS las canciones (sin filtros) - para script de limpieza
  async getAllSongsRaw(limit: number = 500, offset: number = 0): Promise<Song[]> {
    this.logger.log(
      `📋 Obteniendo TODAS las canciones sin filtros (limit: ${limit}, offset: ${offset})`,
    );

    const songs = await this.songRepository
      .createQueryBuilder('song')
      .orderBy('song.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();

    this.logger.log(`✅ Obtenidas ${songs.length} canciones (sin filtros)`);
    return songs;
  }


  // Busca canciones por género (SOLO las que tienen audio)
  async findSongsByGenre(genre: string, limit: number = 20): Promise<Song[]> {
    this.logger.log(`🎵 Buscando canciones de género: ${genre}`);

    // Convertir género a lowercase para búsqueda case-insensitive
    const genreLower = genre.toLowerCase();

    const songs = await this.songRepository
      .createQueryBuilder('song')
      .where('LOWER(song.genre) = :genre', { genre: genreLower })
      .andWhere('song.storage_url IS NOT NULL')
      .orderBy('song.createdAt', 'DESC')
      .take(limit)
      .getMany();

    this.logger.log(
      `✅ Encontradas ${songs.length} canciones con audio de género "${genre}"`,
    );
    return songs;
  }

  // Busca canciones por artista (optimizado, SOLO las que tienen audio)
  async findSongsByArtist(artist: string, limit: number = 20): Promise<Song[]> {
    this.logger.log(`👤 Buscando canciones de artista: ${artist}`);

    const songs = await this.songRepository
      .createQueryBuilder('song')
      .where('LOWER(song.artist) LIKE LOWER(:artist)', { artist: `%${artist}%` })
      .andWhere('song.storage_url IS NOT NULL')
      .orderBy('song.viewCount', 'DESC')
      .addOrderBy('song.createdAt', 'DESC')
      .take(limit)
      .getMany();

    this.logger.log(`✅ Encontradas ${songs.length} canciones con audio de "${artist}"`);
    return songs;
  }

  // Búsqueda optimizada por artista y/o canción (SOLO las que tienen audio)
  async searchByArtistAndSong(params: {
    artist?: string;
    song?: string;
    limit?: number;
  }): Promise<Song[]> {
    const { artist, song, limit = 20 } = params;

    this.logger.log(`🔍 Búsqueda optimizada - Artista: "${artist || 'any'}", Canción: "${song || 'any'}"`);

    const query = this.songRepository.createQueryBuilder('song');

    // SOLO canciones con audio (R2)
    query.where('song.storage_url IS NOT NULL');

    if (artist) {
      query.andWhere('LOWER(song.artist) LIKE LOWER(:artist)', {
        artist: `%${artist}%`
      });
    }

    if (song) {
      query.andWhere('LOWER(song.title) LIKE LOWER(:song)', {
        song: `%${song}%`
      });
    }

    const songs = await query
      .orderBy('song.viewCount', 'DESC')
      .addOrderBy('song.createdAt', 'DESC')
      .take(limit)
      .getMany();

    this.logger.log(`✅ Búsqueda optimizada: ${songs.length} resultados con audio encontrados`);
    return songs;
  }

  // Obtener detalles de video de YouTube por ID
  async getYouTubeVideoById(videoId: string): Promise<YouTubeSearchResult | null> {
    this.logger.log(`🔍 Obteniendo detalles de YouTube para video: ${videoId}`);

    try {
      return await this.youtubeService.getVideoById(videoId);
    } catch (error) {
      this.logger.error(`❌ Error al obtener video de YouTube: ${error.message}`);
      throw error;
    }
  }

  // Búsqueda inteligente: BD primero, luego YouTube (con auto-guardado)
  async smartSearch(searchDto: SearchSongsDto): Promise<{
    fromDatabase: Song[];
    fromYoutube: YouTubeSearchResult[];
    source: 'database' | 'youtube' | 'mixed';
  }> {
    this.logger.log(`🧠 Búsqueda inteligente con auto-guardado: "${searchDto.query}"`);

    const MAX_DB_RESULTS = 15;
    const totalMaxResults = searchDto.maxResults || 20;

    // 1. Buscar primero en la base de datos (máximo 15, SOLO canciones con audio y duración válida)
    const dbResults = await this.songRepository
      .createQueryBuilder('song')
      .where('song.storage_url IS NOT NULL')
      .andWhere('song.duration >= :minDuration AND song.duration <= :maxDuration', {
        minDuration: 60,
        maxDuration: 600
      })
      .andWhere(
        '(LOWER(song.title) LIKE LOWER(:query) OR LOWER(song.artist) LIKE LOWER(:query))',
        { query: `%${searchDto.query}%` }
      )
      .take(Math.min(MAX_DB_RESULTS, totalMaxResults))
      .orderBy('song.viewCount', 'DESC')
      .getMany();

    this.logger.log(`📊 Base de datos devolvió ${dbResults.length} canciones (máximo ${MAX_DB_RESULTS}, filtradas por duración 60-600s)`);

    // 2. Calcular cuántos necesitamos de YouTube para llegar al total
    const remainingNeeded = totalMaxResults - dbResults.length;

    // 3. Si no necesitamos más, devolver solo los de BD
    if (remainingNeeded <= 0) {
      this.logger.log(`✅ Ya tenemos ${dbResults.length} canciones de BD (suficientes)`);
      return {
        fromDatabase: dbResults,
        fromYoutube: [],
        source: 'database'
      };
    }

    this.logger.log(`🔍 Tenemos ${dbResults.length} de BD (máx ${MAX_DB_RESULTS}), buscando ${remainingNeeded} en YouTube para llegar a ${totalMaxResults}`);

    try {
      const youtubeResults = await this.youtubeService.searchVideos(
        searchDto.query,
        remainingNeeded * 2, // Pedir más porque filtraremos por duración
        searchDto.regionCode
      );

      // Log de todos los resultados de YouTube ANTES de filtrar
      this.logger.log(`📊 YouTube devolvió ${youtubeResults.length} videos:`);
      youtubeResults.forEach((video, index) => {
        const minutes = Math.floor(video.duration / 60);
        const seconds = video.duration % 60;
        this.logger.log(`  ${index + 1}. "${video.title}" - ${minutes}:${seconds.toString().padStart(2, '0')} (${video.duration}s)`);
      });

      // 4. FILTRAR por duración ANTES de mostrar al usuario
      const filteredYoutubeResults = youtubeResults.filter(video => {
        // Solo canciones entre 1-10 minutos (60-600 segundos)
        if (video.duration < 60 || video.duration > 600) {
          this.logger.log(`❌ FILTRADO: "${video.title}" (duración: ${video.duration}s)`);
          return false;
        }
        this.logger.log(`✅ PASA: "${video.title}" (duración: ${video.duration}s)`);
        return true;
      }).slice(0, remainingNeeded); // Limitar a la cantidad necesaria

      // 5. AUTO-GUARDAR resultados filtrados de YouTube en BD (en background)
      // ⚠️ DESHABILITADO: Cerramos entrada de nueva música a la BD por almacenamiento
      // this.autoSaveYouTubeResults(filteredYoutubeResults);
      this.logger.log('🚫 Auto-guardado deshabilitado - búsquedas solo lectura');

      this.logger.log(`✅ Búsqueda híbrida: ${dbResults.length} de BD + ${filteredYoutubeResults.length} de YouTube (${youtubeResults.length - filteredYoutubeResults.length} filtrados por duración)`);

      return {
        fromDatabase: dbResults,
        fromYoutube: filteredYoutubeResults,
        source: dbResults.length > 0 && filteredYoutubeResults.length > 0 ? 'mixed' :
               dbResults.length > 0 ? 'database' : 'youtube'
      };

    } catch (error) {
      this.logger.warn(`⚠️ Error en YouTube, devolviendo solo resultados de BD`);
      return {
        fromDatabase: dbResults,
        fromYoutube: [],
        source: 'database'
      };
    }
  }

  // Autocomplete: devuelve sugerencias de artistas únicos basadas en la BD
  async getAutocompleteSuggestions(query: string, limit: number = 10): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    this.logger.log(`💡 Buscando sugerencias para: "${query}"`);

    try {
      // Buscar artistas únicos que coincidan con el query
      const artists = await this.songRepository
        .createQueryBuilder('song')
        .select('DISTINCT song.artist', 'artist')
        .where('LOWER(song.artist) LIKE LOWER(:query)', { query: `%${query}%` })
        .andWhere('song.storage_url IS NOT NULL') // Solo artistas con audio (R2)
        .orderBy('song.artist', 'ASC')
        .limit(limit)
        .getRawMany();

      const suggestions = artists.map(row => row.artist).filter(artist => artist && artist.trim());

      this.logger.log(`✅ Encontradas ${suggestions.length} sugerencias de artistas`);
      return suggestions;
    } catch (error) {
      this.logger.error(`❌ Error en autocomplete: ${error.message}`);
      return [];
    }
  }

  // Lista de palabras prohibidas en títulos (filtrar compilaciones, lives, álbumes completos, etc.)
  private readonly TITLE_BLACKLIST = [
    // Mix / Mezclas / Remixes
    'mix', 'megamix', 'minimix', 'dj mix', 'remix compilation', 'mixed by',
    'mashup', 'medley', 'mezcla', 'popurri', 'popurrí', 'potpourri',

    // Top / Mejores
    'top 10', 'top 20', 'top 30', 'top 40', 'top 50', 'top 100',
    'top songs', 'top hits', 'top music', 'top tracks',
    'lo mejor', 'the best', 'best of', 'mejores', 'best songs', 'las mejores',

    // Grandes éxitos / Hits
    'grandes exitos', 'grandes éxitos', 'greatest hits', 'top hits',
    'hits compilation', 'best hits', 'all hits', 'super hits', 'mega hits',

    // Compilaciones / Colecciones
    'compilation', 'compilación', 'compilacion',
    'recopilación', 'recopilacion', 'colección', 'coleccion', 'collection',

    // Álbum completo
    'full album', 'album completo', 'álbum completo', 'complete album',
    'disco completo', 'entire album', 'whole album',

    // Playlist / Listas
    'playlist', 'lista de reproducción', 'lista reproduccion',

    // Horas (videos largos)
    ' hour', ' hours', ' hora', ' horas', ' hr', ' hrs',
    '1 hour', '2 hour', '3 hour', '1 hora', '2 hora', '3 hora',

    // Live/Conciertos/Recitales
    'live concert', 'concierto completo', 'full concert', 'en vivo completo',
    'live', 'en vivo', 'vivo', 'ao vivo', 'live session', 'live performance',
    'recital completo', 'recital', 'show completo',

    // Versiones modificadas / No oficiales
    'cover', 'covers', 'cover version',
    'nightcore',
    'sped up', 'spedup', 'speed up', 'fast version',
    'slowed', 'slowed down', 'reverb', 'slowed + reverb',
    'acoustic version', 'acoustic',
    '8d audio', '8d', '16d',

    // Karaoke/Lyrics/Instrumental
    'karaoke', 'lyrics video', 'letra', 'con letra',
    'instrumental', 'instrumental version',

    // Otros indicadores de compilación
    'all songs', 'todas las canciones', 'all tracks', 'todas sus canciones',
    'discography', 'discografia', 'discografía'
  ];

  // Verificar si el título contiene palabras prohibidas
  private hasBannedWords(title: string): boolean {
    const lowerTitle = title.toLowerCase();
    return this.TITLE_BLACKLIST.some(word => lowerTitle.includes(word));
  }

  // Auto-guardar resultados de YouTube en background (sin bloquear respuesta)
  private async autoSaveYouTubeResults(youtubeResults: YouTubeSearchResult[]): Promise<void> {
    // Ejecutar en background sin esperar
    setImmediate(async () => {
      this.logger.log(`🤖 Auto-guardando ${youtubeResults.length} resultados de YouTube...`);

      for (const video of youtubeResults) {
        try {
          // FILTRO 1: Verificar si el título tiene palabras prohibidas
          if (this.hasBannedWords(video.title)) {
            this.logger.log(`⏭️  Omitiendo "${video.title}" (contiene palabras prohibidas)`);
            continue;
          }

          // FILTRO 2: Verificar duración (solo canciones entre 1 min y 10 min)
          if (video.duration < 60 || video.duration > 600) {
            this.logger.log(`⏭️  Omitiendo "${video.title}" (duración: ${video.duration}s)`);
            continue;
          }

          // FILTRO 3: Verificar si ya existe
          const existing = await this.findSongByYoutubeId(video.id);
          if (existing) {
            continue; // Ya existe, omitir
          }

          // Guardar nueva canción
          await this.saveFromYoutube(video.id);
          this.logger.log(`✅ Auto-guardada: "${video.title}"`);

        } catch (error) {
          this.logger.warn(`⚠️ No se pudo auto-guardar "${video.title}": ${error.message}`);
        }
      }
    });
  }

  // Guardar canción de YouTube automáticamente en BD
  async saveFromYoutube(youtubeId: string): Promise<Song> {
    this.logger.log(`💾 Guardando automáticamente desde YouTube ID: ${youtubeId}`);

    // 1. Verificar si ya existe en BD
    const existingSong = await this.findSongByYoutubeId(youtubeId);
    if (existingSong) {
      this.logger.warn(`⚠️ Canción ya existe en BD: "${existingSong.title}"`);
      throw new ConflictException(`La canción ya existe en la base de datos`);
    }

    // 2. Obtener datos del video de YouTube
    const youtubeVideo = await this.getYouTubeVideoById(youtubeId);
    if (!youtubeVideo) {
      throw new NotFoundException(`Video con ID ${youtubeId} no encontrado en YouTube`);
    }

    // 3. FILTROS DE CALIDAD - Aplicar antes de guardar

    // FILTRO 1: Verificar si el título tiene palabras prohibidas
    if (this.hasBannedWords(youtubeVideo.title)) {
      this.logger.log(`⏭️  Omitiendo "${youtubeVideo.title}" (contiene palabras prohibidas)`);
      throw new BadRequestException(`El video contiene palabras prohibidas en el título`);
    }

    // FILTRO 2: Verificar duración (solo canciones entre 1 min y 10 min)
    if (youtubeVideo.duration < 60 || youtubeVideo.duration > 600) {
      this.logger.log(`⏭️  Omitiendo "${youtubeVideo.title}" (duración: ${youtubeVideo.duration}s)`);
      throw new BadRequestException(`La duración del video no es válida para una canción`);
    }

    // 4. Detectar género automáticamente
    let detectedGenre = this.genreDetector.detectGenre(
      youtubeVideo.artist || 'Desconocido',
      youtubeVideo.title
    );

    // Si no se detectó, asignar "sinCategoria" para revisión manual
    if (!detectedGenre) {
      detectedGenre = 'sinCategoria';
      this.logger.warn(`⚠️ No se pudo detectar género para "${youtubeVideo.artist}" - guardar como "sinCategoria"`);
    }

    // 5. Crear objeto CreateSongDto desde datos de YouTube
    const createSongDto: CreateSongDto = {
      title: youtubeVideo.title,
      artist: youtubeVideo.artist || 'Desconocido',
      genre: detectedGenre, // Siempre tiene un valor (detectado o "sinCategoria")
      duration: youtubeVideo.duration || 0,
      youtubeId: youtubeVideo.id,
      viewCount: youtubeVideo.viewCount,
      publishedAt: youtubeVideo.publishedAt
    };

    // 5. Guardar en BD usando el método existente
    return await this.createSong(createSongDto);
  }

  // Buscar en YouTube y guardar todo automáticamente
  async searchAndSaveAll(searchDto: SearchSongsDto): Promise<{
    saved: Song[];
    skipped: string[];
    total: number;
  }> {
    this.logger.log(`🤖 Búsqueda y guardado automático: "${searchDto.query}"`);

    // 1. Buscar en YouTube
    const youtubeResults = await this.youtubeService.searchVideos(
      searchDto.query,
      searchDto.maxResults,
      searchDto.regionCode
    );

    const saved: Song[] = [];
    const skipped: string[] = [];

    // 2. Intentar guardar cada resultado
    for (const video of youtubeResults) {
      try {
        // Verificar si ya existe
        const existing = await this.findSongByYoutubeId(video.id);
        if (existing) {
          skipped.push(`${video.title} - Ya existe en BD`);
          continue;
        }

        // Guardar nueva canción
        const savedSong = await this.saveFromYoutube(video.id);
        saved.push(savedSong);

        this.logger.log(`✅ Guardada: "${savedSong.title}" por ${savedSong.artist}`);

      } catch (error) {
        this.logger.warn(`⚠️ No se pudo guardar "${video.title}": ${error.message}`);
        skipped.push(`${video.title} - Error: ${error.message}`);
      }
    }

    this.logger.log(`🎯 Resumen: ${saved.length} guardadas, ${skipped.length} omitidas de ${youtubeResults.length} encontradas`);

    return {
      saved,
      skipped,
      total: youtubeResults.length
    };
  }

  // Actualizar canción
  async updateSong(id: string, updateData: {
    title?: string;
    artist?: string;
    genre?: string;
    duration?: number;
    cloudinaryUrl?: string;
  }): Promise<Song> {
    this.logger.log(`🔄 Actualizando canción con ID: ${id}`);

    const song = await this.findSongById(id);

    // Actualizar solo los campos proporcionados
    if (updateData.title !== undefined) song.title = updateData.title;
    if (updateData.artist !== undefined) song.artist = updateData.artist;
    if (updateData.genre !== undefined) song.genre = updateData.genre;
    if (updateData.duration !== undefined) song.duration = updateData.duration;
    if (updateData.cloudinaryUrl !== undefined) song.cloudinaryUrl = updateData.cloudinaryUrl;

    try {
      const updatedSong = await this.songRepository.save(song);

      this.logger.log(`✅ Canción actualizada exitosamente: "${updatedSong.title}"`);

      // Emitir evento
      this.eventEmitter.emit('song.updated', { song: updatedSong });

      return updatedSong;
    } catch (error) {
      this.logger.error(`❌ Error al actualizar canción: ${error.message}`);
      throw error;
    }
  }

  // Eliminar canción
  async deleteSong(id: string): Promise<void> {
    this.logger.log(`🗑️ Eliminando canción con ID: ${id}`);

    const song = await this.findSongById(id);

    try {
      await this.songRepository.remove(song);
      this.logger.log(`✅ Canción eliminada: "${song.title}"`);

      // Emitir evento
      this.eventEmitter.emit('song.deleted', { song });
    } catch (error) {
      this.logger.error(`❌ Error al eliminar canción: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reproduce una canción y emite evento song.started
   */
  async playSong(songId: string): Promise<Song> {
    this.logger.log(`▶️  Playing song: ${songId}`);

    try {
      const song = await this.songRepository.findOne({ where: { id: songId } });

      if (!song) {
        throw new NotFoundException(`Song not found: ${songId}`);
      }

      // Emitir evento song.started para ParallelImageService
      this.eventEmitter.emit('song.started', {
        songId: song.id,
        title: song.title,
        artist: song.artist,
        genre: song.genre,
        duration: song.duration || 0,
      });

      this.logger.log(`✅ Song started: ${song.title} - ${song.artist} (${song.genre})`);

      return song;
    } catch (error) {
      this.logger.error(`❌ Error playing song: ${error.message}`);
      throw error;
    }
  }
}
