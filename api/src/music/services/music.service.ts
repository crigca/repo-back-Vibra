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

  // Reproduce canción
  async playSong(songId: string): Promise<Song> {
    const song = await this.findSongById(songId);

    this.logger.log(`▶️ Reproduciendo: "${song.title}" por ${song.artist}`);

    // Emitir evento
    this.eventEmitter.emit('song.started', {
      song,
      timestamp: new Date(),
    });

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

  // Obtiene canciones con paginación
  async getAllSongs(limit: number = 50, offset: number = 0): Promise<Song[]> {
    this.logger.log(
      `📋 Obteniendo canciones (limit: ${limit}, offset: ${offset})`,
    );

    const songs = await this.songRepository.find({
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    this.logger.log(`✅ Obtenidas ${songs.length} canciones`);
    return songs;
  }

  // Cuenta total de canciones
  async getTotalSongsCount(): Promise<number> {
    const count = await this.songRepository.count();
    this.logger.log(`📊 Total de canciones en BD: ${count}`);
    return count;
  }

  // Busca canciones por género
  async findSongsByGenre(genre: string, limit: number = 20): Promise<Song[]> {
    this.logger.log(`🎵 Buscando canciones de género: ${genre}`);

    const songs = await this.songRepository.find({
      where: { genre },
      take: limit,
      order: { createdAt: 'DESC' },
    });

    this.logger.log(
      `✅ Encontradas ${songs.length} canciones de género "${genre}"`,
    );
    return songs;
  }

  // Busca canciones por artista
  async findSongsByArtist(artist: string, limit: number = 20): Promise<Song[]> {
    this.logger.log(`👤 Buscando canciones de artista: ${artist}`);

    const songs = await this.songRepository.find({
      where: { artist },
      take: limit,
      order: { createdAt: 'DESC' },
    });

    this.logger.log(`✅ Encontradas ${songs.length} canciones de "${artist}"`);
    return songs;
  }

  // Búsqueda inteligente: BD primero, luego YouTube
  async smartSearch(searchDto: SearchSongsDto): Promise<{
    fromDatabase: Song[];
    fromYoutube: YouTubeSearchResult[];
    source: 'database' | 'youtube' | 'mixed';
  }> {
    this.logger.log(`🧠 Búsqueda inteligente: "${searchDto.query}"`);

    // 1. Buscar primero en la base de datos
    const dbResults = await this.songRepository
      .createQueryBuilder('song')
      .where('LOWER(song.title) LIKE LOWER(:query)', { query: `%${searchDto.query}%` })
      .orWhere('LOWER(song.artist) LIKE LOWER(:query)', { query: `%${searchDto.query}%` })
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
}
