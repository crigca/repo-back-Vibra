import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  Logger, 
  ParseUUIDPipe,
  ValidationPipe,
  HttpStatus,
  HttpCode
} from '@nestjs/common';

import { MusicService } from '../services/music.service';
import { SearchSongsDto } from '../dto/search-songs.dto';
import { CreateSongDto } from '../dto/create-song.dto';
import { Song } from '../entities/song.entity';
import { YouTubeSearchResult } from '../services/youtube.service';

/**
 * Controlador de música con endpoints REST
 */
@Controller('music')
export class MusicController {
  private readonly logger = new Logger(MusicController.name);

  constructor(private readonly musicService: MusicService) {}

  // Buscar canciones en YouTube
  @Get('search')
  async searchSongs(
    @Query(new ValidationPipe({ transform: true })) searchDto: SearchSongsDto
  ): Promise<YouTubeSearchResult[]> {
    this.logger.log(`🔍 GET /music/search - Query: "${searchDto.query}"`);
    
    try {
      const results = await this.musicService.searchSongs(searchDto);
      
      this.logger.log(`✅ Búsqueda exitosa: ${results.length} resultados`);
      return results;
      
    } catch (error) {
      this.logger.error(`❌ Error en búsqueda: ${error.message}`);
      throw error;
    }
  }

  // Crear nueva canción en BD
  @Post('songs')
  @HttpCode(HttpStatus.CREATED)
  async createSong(
    @Body(ValidationPipe) createSongDto: CreateSongDto
  ): Promise<Song> {
    this.logger.log(`💾 POST /music/songs - Título: "${createSongDto.title}"`);
    
    try {
      const song = await this.musicService.createSong(createSongDto);
      
      this.logger.log(`✅ Canción creada con ID: ${song.id}`);
      return song;
      
    } catch (error) {
      this.logger.error(`❌ Error al crear canción: ${error.message}`);
      throw error;
    }
  }

  // Obtener canciones con paginación
  @Get('songs')
  async getAllSongs(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<Song[]> {
    const parsedLimit = limit ? parseInt(limit.toString()) : 50;
    const parsedOffset = offset ? parseInt(offset.toString()) : 0;
    
    this.logger.log(`📋 GET /music/songs - Limit: ${parsedLimit}, Offset: ${parsedOffset}`);
    
    try {
      const songs = await this.musicService.getAllSongs(parsedLimit, parsedOffset);
      
      this.logger.log(`✅ Obtenidas ${songs.length} canciones`);
      return songs;
      
    } catch (error) {
      this.logger.error(`❌ Error al obtener canciones: ${error.message}`);
      throw error;
    }
  }

  // Contar total de canciones
  @Get('songs/count')
  async getTotalSongsCount(): Promise<{ total: number }> {
    this.logger.log('📊 GET /music/songs/count');
    
    try {
      const total = await this.musicService.getTotalSongsCount();
      
      this.logger.log(`✅ Total de canciones: ${total}`);
      return { total };
      
    } catch (error) {
      this.logger.error(`❌ Error al contar canciones: ${error.message}`);
      throw error;
    }
  }

  // Obtener canción por ID
  @Get('songs/:id')
  async getSongById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<Song> {
    this.logger.log(`🔍 GET /music/songs/${id}`);
    
    try {
      const song = await this.musicService.findSongById(id);
      
      this.logger.log(`✅ Canción encontrada: "${song.title}"`);
      return song;
      
    } catch (error) {
      this.logger.error(`❌ Error al buscar canción: ${error.message}`);
      throw error;
    }
  }

  // Buscar canciones por género
  @Get('songs/genre/:genre')
  async getSongsByGenre(
    @Param('genre') genre: string,
    @Query('limit') limit?: number
  ): Promise<Song[]> {
    const parsedLimit = limit ? parseInt(limit.toString()) : 20;
    
    this.logger.log(`🎵 GET /music/songs/genre/${genre} - Limit: ${parsedLimit}`);
    
    try {
      const songs = await this.musicService.findSongsByGenre(genre, parsedLimit);
      
      this.logger.log(`✅ Encontradas ${songs.length} canciones de género "${genre}"`);
      return songs;
      
    } catch (error) {
      this.logger.error(`❌ Error al buscar por género: ${error.message}`);
      throw error;
    }
  }

  // Buscar canciones por artista
  @Get('songs/artist/:artist')
  async getSongsByArtist(
    @Param('artist') artist: string,
    @Query('limit') limit?: number
  ): Promise<Song[]> {
    const parsedLimit = limit ? parseInt(limit.toString()) : 20;
    
    this.logger.log(`👤 GET /music/songs/artist/${artist} - Limit: ${parsedLimit}`);
    
    try {
      const songs = await this.musicService.findSongsByArtist(artist, parsedLimit);
      
      this.logger.log(`✅ Encontradas ${songs.length} canciones de "${artist}"`);
      return songs;
      
    } catch (error) {
      this.logger.error(`❌ Error al buscar por artista: ${error.message}`);
      throw error;
    }
  }

  // Reproducir canción
  @Post('play/:id')
  async playSong(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<Song> {
    this.logger.log(`▶️ POST /music/play/${id}`);
    
    try {
      const song = await this.musicService.playSong(id);
      
      this.logger.log(`✅ Reproduciendo: "${song.title}"`);
      return song;
      
    } catch (error) {
      this.logger.error(`❌ Error al reproducir: ${error.message}`);
      throw error;
    }
  }

  // Pausar reproducción
  @Post('pause')
  async pauseSong(): Promise<{ message: string }> {
    this.logger.log('⏸️ POST /music/pause');
    
    try {
      await this.musicService.pauseSong();
      
      this.logger.log('✅ Reproducción pausada');
      return { message: 'Reproducción pausada exitosamente' };
      
    } catch (error) {
      this.logger.error(`❌ Error al pausar: ${error.message}`);
      throw error;
    }
  }
}