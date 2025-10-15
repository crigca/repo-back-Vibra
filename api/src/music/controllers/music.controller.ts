import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  ParseUUIDPipe,
  ValidationPipe,
  HttpStatus,
  HttpCode,
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

  // Buscar canciones en YouTube (solo búsqueda, no guarda en BD)
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

  // Obtener canciones con paginación (ALEATORIAS con MP3)
  @Get('songs')
  async getAllSongs(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<Song[]> {
    const parsedLimit = limit ? parseInt(limit.toString()) : 50;
    const parsedOffset = offset ? parseInt(offset.toString()) : 0;

    this.logger.log(
      `📋 GET /music/songs - Limit: ${parsedLimit}, Offset: ${parsedOffset}`,
    );

    try {
      const songs = await this.musicService.getAllSongs(
        parsedLimit,
        parsedOffset,
      );

      this.logger.log(`✅ Obtenidas ${songs.length} canciones`);
      return songs;
    } catch (error) {
      this.logger.error(`❌ Error al obtener canciones: ${error.message}`);
      throw error;
    }
  }

  // Obtener TODAS las canciones sin filtros (para script de limpieza)
  @Get('songs/all-raw')
  async getAllSongsRaw(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<Song[]> {
    const parsedLimit = limit ? parseInt(limit.toString()) : 500;
    const parsedOffset = offset ? parseInt(offset.toString()) : 0;

    this.logger.log(
      `📋 GET /music/songs/all-raw - Limit: ${parsedLimit}, Offset: ${parsedOffset}`,
    );

    try {
      const songs = await this.musicService.getAllSongsRaw(
        parsedLimit,
        parsedOffset,
      );

      this.logger.log(`✅ Obtenidas ${songs.length} canciones sin filtros`);
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

  // Obtener canciones sin audio (para script de descarga)
  @Get('songs/without-audio')
  async getSongsWithoutAudio(
    @Query('limit') limit?: number,
  ): Promise<Song[]> {
    const parsedLimit = limit ? parseInt(limit.toString()) : 500;

    this.logger.log(
      `📋 GET /music/songs/without-audio - Limit: ${parsedLimit}`,
    );

    try {
      const songs = await this.musicService.getSongsWithoutAudio(parsedLimit);

      this.logger.log(`✅ Obtenidas ${songs.length} canciones sin MP3`);
      return songs;
    } catch (error) {
      this.logger.error(`❌ Error al obtener canciones sin MP3: ${error.message}`);
      throw error;
    }
  }

  // Obtener canción por ID
  @Get('songs/:id')
  async getSongById(@Param('id', ParseUUIDPipe) id: string): Promise<Song> {
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
    @Query('limit') limit?: number,
  ): Promise<Song[]> {
    const parsedLimit = limit ? parseInt(limit.toString()) : 20;

    this.logger.log(
      `🎵 GET /music/songs/genre/${genre} - Limit: ${parsedLimit}`,
    );

    try {
      const songs = await this.musicService.findSongsByGenre(
        genre,
        parsedLimit,
      );

      this.logger.log(
        `✅ Encontradas ${songs.length} canciones de género "${genre}"`,
      );
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
    @Query('limit') limit?: number,
  ): Promise<Song[]> {
    const parsedLimit = limit ? parseInt(limit.toString()) : 20;

    this.logger.log(
      `👤 GET /music/songs/artist/${artist} - Limit: ${parsedLimit}`,
    );

    try {
      const songs = await this.musicService.findSongsByArtist(
        artist,
        parsedLimit,
      );

      this.logger.log(
        `✅ Encontradas ${songs.length} canciones de "${artist}"`,
      );
      return songs;
    } catch (error) {
      this.logger.error(`❌ Error al buscar por artista: ${error.message}`);
      throw error;
    }
  }


  // Búsqueda optimizada por artista y/o canción
  @Get('search-optimized')
  async searchByArtistAndSong(
    @Query('artist') artist?: string,
    @Query('song') song?: string,
    @Query('limit') limit?: number,
  ): Promise<Song[]> {
    const parsedLimit = limit ? parseInt(limit.toString()) : 20;

    this.logger.log(
      `🔍 GET /music/search-optimized - Artista: "${artist || 'any'}", Canción: "${song || 'any'}"`
    );

    try {
      const songs = await this.musicService.searchByArtistAndSong({
        artist,
        song,
        limit: parsedLimit,
      });

      this.logger.log(`✅ Búsqueda optimizada exitosa: ${songs.length} resultados`);
      return songs;
    } catch (error) {
      this.logger.error(`❌ Error en búsqueda optimizada: ${error.message}`);
      throw error;
    }
  }

  // Búsqueda inteligente: BD primero, luego YouTube
  @Get('search-smart')
  async smartSearch(
    @Query(new ValidationPipe({ transform: true })) searchDto: SearchSongsDto
  ): Promise<{
    fromDatabase: Song[];
    fromYoutube: YouTubeSearchResult[];
    source: 'database' | 'youtube' | 'mixed';
    total: number;
  }> {
    this.logger.log(`🧠 GET /music/search-smart - Query: "${searchDto.query}"`);

    try {
      const results = await this.musicService.smartSearch(searchDto);
      const total = results.fromDatabase.length + results.fromYoutube.length;

      this.logger.log(`✅ Búsqueda inteligente exitosa: ${total} resultados (${results.source})`);

      return {
        ...results,
        total
      };
    } catch (error) {
      this.logger.error(`❌ Error en búsqueda inteligente: ${error.message}`);
      throw error;
    }
  }

  // Crear nueva canción en BD (usado por seed script)
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

  // Guardar canción de YouTube en BD
  @Post('save-from-youtube')
  @HttpCode(HttpStatus.CREATED)
  async saveFromYoutube(
    @Body() youtubeData: { youtubeId: string }
  ): Promise<Song> {
    this.logger.log(`💾 POST /music/save-from-youtube - YouTube ID: "${youtubeData.youtubeId}"`);

    try {
      const song = await this.musicService.saveFromYoutube(youtubeData.youtubeId);

      this.logger.log(`✅ Canción guardada desde YouTube con ID: ${song.id}`);
      return song;
    } catch (error) {
      this.logger.error(`❌ Error al guardar desde YouTube: ${error.message}`);
      throw error;
    }
  }

  // Actualizar canción
  @Put('songs/:id')
  async updateSong(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateData: {
      title?: string;
      artist?: string;
      genre?: string;
      duration?: number;
    }
  ): Promise<Song> {
    this.logger.log(`🔄 PUT /music/songs/${id}`);

    try {
      const song = await this.musicService.updateSong(id, updateData);

      this.logger.log(`✅ Canción actualizada: "${song.title}"`);
      return song;
    } catch (error) {
      this.logger.error(`❌ Error al actualizar canción: ${error.message}`);
      throw error;
    }
  }

  // Actualizar parcialmente canción (usado por download-mp3.js)
  @Patch('songs/:id')
  async patchSong(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: {
      audioPath?: string;
      title?: string;
      artist?: string;
      genre?: string;
      duration?: number;
    }
  ): Promise<Song> {
    this.logger.log(`🔄 PATCH /music/songs/${id}`);

    try {
      const song = await this.musicService.updateSong(id, updateData);

      this.logger.log(`✅ Canción actualizada: "${song.title}"`);
      return song;
    } catch (error) {
      this.logger.error(`❌ Error al actualizar canción: ${error.message}`);
      throw error;
    }
  }

  // Eliminar canción
  @Delete('songs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSong(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    this.logger.log(`🗑️ DELETE /music/songs/${id}`);

    try {
      await this.musicService.deleteSong(id);

      this.logger.log(`✅ Canción eliminada exitosamente`);
    } catch (error) {
      this.logger.error(`❌ Error al eliminar canción: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /music/play/:id
   * Reproduce una canción y emite evento para generar imágenes
   */
  @Post('play/:id')
  @HttpCode(HttpStatus.OK)
  async playSong(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`▶️  POST /music/play/${id}`);

    try {
      const song = await this.musicService.playSong(id);

      this.logger.log(`✅ Song playing: ${song.title}`);

      return {
        success: true,
        data: song,
        message: 'Song started successfully',
      };
    } catch (error) {
      this.logger.error(`❌ Error playing song: ${error.message}`);
      throw error;
    }
  }

}
