import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Song } from '../entities/song.entity';
import { YoutubeService, YouTubeSearchResult } from './youtube.service';
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

    // Verificar si ya existe
    const existingSong = await this.songRepository.findOne({
      where: { youtubeId: createSongDto.youtubeId },
    });

    if (existingSong) {
      this.logger.warn(
        `⚠️ Canción ya existe con youtubeId: ${createSongDto.youtubeId}`,
      );
      throw new ConflictException(
        `La canción con YouTube ID ${createSongDto.youtubeId} ya existe en la base de datos`,
      );
    }

    try {
      const songData = {
        ...createSongDto,
        publishedAt: createSongDto.publishedAt
          ? new Date(createSongDto.publishedAt)
          : undefined,
      };

      const song = this.songRepository.create(songData);

      const savedSong = await this.songRepository.save(song);

      this.logger.log(
        `✅ Canción guardada exitosamente con ID: ${savedSong.id}`,
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
    this.logger.log(`🔍 Buscando canción por ID: ${id}`);

    const song = await this.songRepository.findOne({ where: { id } });

    if (!song) {
      this.logger.warn(`⚠️ Canción no encontrada con ID: ${id}`);
      throw new NotFoundException(`Canción con ID ${id} no encontrada`);
    }

    this.logger.log(
      `✅ Canción encontrada: "${song.title}" por ${song.artist}`,
    );
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

  // Obtiene canciones con paginación (SOLO las que tienen Cloudinary URL) - UNA POR GÉNERO
  async getAllSongs(limit: number = 50): Promise<Song[]> {
    this.logger.log(
      `📋 Obteniendo ${limit} canciones ALEATORIAS (una por género) con Cloudinary URL`,
    );

    // Query para obtener una canción aleatoria por cada género diferente
    const songs = await this.songRepository.query(`
      SELECT DISTINCT ON (genre) *
      FROM songs
      WHERE "cloudinaryUrl" IS NOT NULL
        AND genre IS NOT NULL
        AND genre != ''
      ORDER BY genre, RANDOM()
      LIMIT $1
    `, [limit]);

    this.logger.log(`✅ Obtenidas ${songs.length} canciones (una por género, aleatorias)`);
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


  // Busca canciones por género (SOLO las que tienen Cloudinary URL)
  async findSongsByGenre(genre: string, limit: number = 20): Promise<Song[]> {
    this.logger.log(`🎵 Buscando canciones de género: ${genre}`);

    const songs = await this.songRepository
      .createQueryBuilder('song')
      .where('song.genre = :genre', { genre })
      .andWhere('song.cloudinaryUrl IS NOT NULL')
      .orderBy('song.createdAt', 'DESC')
      .take(limit)
      .getMany();

    this.logger.log(
      `✅ Encontradas ${songs.length} canciones con Cloudinary de género "${genre}"`,
    );
    return songs;
  }

  // Busca canciones por artista (optimizado, SOLO las que tienen Cloudinary URL)
  async findSongsByArtist(artist: string, limit: number = 20): Promise<Song[]> {
    this.logger.log(`👤 Buscando canciones de artista: ${artist}`);

    const songs = await this.songRepository
      .createQueryBuilder('song')
      .where('LOWER(song.artist) LIKE LOWER(:artist)', { artist: `%${artist}%` })
      .andWhere('song.cloudinaryUrl IS NOT NULL')
      .orderBy('song.viewCount', 'DESC')
      .addOrderBy('song.createdAt', 'DESC')
      .take(limit)
      .getMany();

    this.logger.log(`✅ Encontradas ${songs.length} canciones con Cloudinary de "${artist}"`);
    return songs;
  }

  // Búsqueda optimizada por artista y/o canción (SOLO las que tienen Cloudinary URL)
  async searchByArtistAndSong(params: {
    artist?: string;
    song?: string;
    limit?: number;
  }): Promise<Song[]> {
    const { artist, song, limit = 20 } = params;

    this.logger.log(`🔍 Búsqueda optimizada - Artista: "${artist || 'any'}", Canción: "${song || 'any'}"`);

    const query = this.songRepository.createQueryBuilder('song');

    // SOLO canciones con cloudinaryUrl
    query.where('song.cloudinaryUrl IS NOT NULL');

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

    // 1. Buscar primero en la base de datos (SOLO canciones con Cloudinary URL)
    const dbResults = await this.songRepository
      .createQueryBuilder('song')
      .where('song.cloudinaryUrl IS NOT NULL')
      .andWhere(
        '(LOWER(song.title) LIKE LOWER(:query) OR LOWER(song.artist) LIKE LOWER(:query))',
        { query: `%${searchDto.query}%` }
      )
      .take(searchDto.maxResults)
      .orderBy('song.viewCount', 'DESC')
      .getMany();

    // 2. Si encontramos suficientes en BD, devolver solo esos
    if (dbResults.length >= (searchDto.maxResults || 10)) {
      this.logger.log(`✅ Encontradas ${dbResults.length} canciones en BD (suficientes)`);
      return {
        fromDatabase: dbResults,
        fromYoutube: [],
        source: 'database'
      };
    }

    // 3. Si no hay suficientes, complementar con YouTube
    const remainingNeeded = (searchDto.maxResults || 10) - dbResults.length;
    this.logger.log(`🔍 Solo ${dbResults.length} en BD, buscando ${remainingNeeded} en YouTube`);

    try {
      const youtubeResults = await this.youtubeService.searchVideos(
        searchDto.query,
        remainingNeeded,
        searchDto.regionCode
      );

      // 4. AUTO-GUARDAR resultados de YouTube en BD (en background)
      this.autoSaveYouTubeResults(youtubeResults);

      this.logger.log(`✅ Búsqueda híbrida: ${dbResults.length} de BD + ${youtubeResults.length} de YouTube`);

      return {
        fromDatabase: dbResults,
        fromYoutube: youtubeResults,
        source: dbResults.length > 0 && youtubeResults.length > 0 ? 'mixed' :
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

  // Auto-guardar resultados de YouTube en background (sin bloquear respuesta)
  private async autoSaveYouTubeResults(youtubeResults: YouTubeSearchResult[]): Promise<void> {
    // Ejecutar en background sin esperar
    setImmediate(async () => {
      this.logger.log(`🤖 Auto-guardando ${youtubeResults.length} resultados de YouTube...`);

      for (const video of youtubeResults) {
        try {
          // Verificar si ya existe
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

    // 3. Crear objeto CreateSongDto desde datos de YouTube
    const createSongDto: CreateSongDto = {
      title: youtubeVideo.title,
      artist: youtubeVideo.artist || 'Desconocido',
      genre: 'Sin categoría',
      duration: youtubeVideo.duration || 0,
      youtubeId: youtubeVideo.id,
      viewCount: youtubeVideo.viewCount,
      publishedAt: youtubeVideo.publishedAt
    };

    // 4. Guardar en BD usando el método existente
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

      this.logger.log(`✅ Canción eliminada exitosamente: "${song.title}"`);

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
