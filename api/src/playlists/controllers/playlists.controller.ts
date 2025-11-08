import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Logger,
  ParseUUIDPipe,
  ValidationPipe,
  HttpStatus,
  HttpCode,
  ParseBoolPipe,
  UseGuards,
} from '@nestjs/common';

import { PlaylistsService } from '../services/playlists.service';
import { CreatePlaylistDto } from '../dto/create-playlist.dto';
import { UpdatePlaylistDto } from '../dto/update-playlist.dto';
import { AddSongToPlaylistDto } from '../dto/add-song-playlist.dto';
import { ReorderSongsDto } from '../dto/reorder-songs.dto';
import { Playlist } from '../entities/playlist.entity';
import { PlaylistSong } from '../entities/playlist-song.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { OptionalUser } from '../../auth/decorators/optional-user.decorator';

@Controller('playlists')
export class PlaylistsController {
  private readonly logger = new Logger(PlaylistsController.name);

  constructor(private readonly playlistsService: PlaylistsService) {}

  // ============= CRUD BÁSICO DE PLAYLISTS =============

  // Crear nueva playlist (requiere autenticación)
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createPlaylistDto: CreatePlaylistDto,
    @CurrentUser() user: any,
  ): Promise<Playlist> {
    this.logger.log(`💾 POST /playlists - Nombre: "${createPlaylistDto.name}" - Usuario: ${user.username}`);

    try {
      const playlist = await this.playlistsService.create(createPlaylistDto, user.userId);

      this.logger.log(`✅ Playlist creada con ID: ${playlist.id}`);
      return playlist;
    } catch (error) {
      this.logger.error(`❌ Error al crear playlist: ${error.message}`);
      throw error;
    }
  }

  // Listar todas las playlists
  @Get()
  async findAll(
    @Query('isPublic', new ParseBoolPipe({ optional: true })) isPublic?: boolean,
    @Query('userId') userId?: string,
  ): Promise<Playlist[]> {
    this.logger.log(`📋 GET /playlists - Público: ${isPublic}, Usuario: ${userId}`);

    try {
      const playlists = await this.playlistsService.findAll(isPublic, userId);

      this.logger.log(`✅ Obtenidas ${playlists.length} playlists`);
      return playlists;
    } catch (error) {
      this.logger.error(`❌ Error al obtener playlists: ${error.message}`);
      throw error;
    }
  }

  // Obtener playlist por ID (autenticación opcional)
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeSongs', new ParseBoolPipe({ optional: true })) includeSongs?: boolean,
    @OptionalUser() user?: any,
  ): Promise<Playlist> {
    const userId = user?.userId;
    this.logger.log(`🔍 GET /playlists/${id} - Usuario: ${userId || 'anónimo'} - Incluir canciones: ${includeSongs}`);

    try {
      const playlist = await this.playlistsService.findOne(id, includeSongs, userId);

      this.logger.log(`✅ Playlist encontrada: "${playlist.name}"`);
      return playlist;
    } catch (error) {
      this.logger.error(`❌ Error al buscar playlist: ${error.message}`);
      throw error;
    }
  }

  // Actualizar playlist (requiere autenticación)
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updatePlaylistDto: UpdatePlaylistDto,
    @CurrentUser() user: any,
  ): Promise<Playlist> {
    this.logger.log(`🔄 PUT /playlists/${id} - Usuario: ${user.username}`);

    try {
      const playlist = await this.playlistsService.update(id, updatePlaylistDto, user.userId);

      this.logger.log(`✅ Playlist actualizada: "${playlist.name}"`);
      return playlist;
    } catch (error) {
      this.logger.error(`❌ Error al actualizar playlist: ${error.message}`);
      throw error;
    }
  }

  // Eliminar playlist (requiere autenticación)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    this.logger.log(`🗑️ DELETE /playlists/${id} - Usuario: ${user.username}`);

    try {
      await this.playlistsService.remove(id, user.userId);

      this.logger.log(`✅ Playlist eliminada exitosamente`);
    } catch (error) {
      this.logger.error(`❌ Error al eliminar playlist: ${error.message}`);
      throw error;
    }
  }

  // ============= GESTIÓN DE CANCIONES EN PLAYLISTS =============

  // Obtener canciones de una playlist
  @Get(':id/songs')
  async getPlaylistSongs(@Param('id', ParseUUIDPipe) id: string): Promise<PlaylistSong[]> {
    this.logger.log(`🎵 GET /playlists/${id}/songs`);

    try {
      const songs = await this.playlistsService.getPlaylistSongs(id);

      this.logger.log(`✅ Obtenidas ${songs.length} canciones de la playlist`);
      return songs;
    } catch (error) {
      this.logger.error(`❌ Error al obtener canciones: ${error.message}`);
      throw error;
    }
  }

  // Agregar canción a playlist (requiere autenticación)
  @Post(':id/songs')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async addSong(
    @Param('id', ParseUUIDPipe) playlistId: string,
    @Body(ValidationPipe) addSongDto: AddSongToPlaylistDto,
    @CurrentUser() user: any,
  ): Promise<PlaylistSong> {
    try {
      const playlistSong = await this.playlistsService.addSong(playlistId, addSongDto);
      return playlistSong;
    } catch (error) {
      this.logger.error(`❌ Error al agregar canción: ${error.message}`);
      throw error;
    }
  }

  // Remover canción específica de playlist (requiere autenticación)
  @Delete(':id/songs/:songId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSong(
    @Param('id', ParseUUIDPipe) playlistId: string,
    @Param('songId', ParseUUIDPipe) songId: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    this.logger.log(`🗑️ DELETE /playlists/${playlistId}/songs/${songId}`);

    try {
      await this.playlistsService.removeSong(playlistId, songId);

      this.logger.log(`✅ Canción removida de la playlist`);
    } catch (error) {
      this.logger.error(`❌ Error al remover canción: ${error.message}`);
      throw error;
    }
  }

  // Reordenar canciones en playlist (requiere autenticación)
  @Patch(':id/songs/reorder')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorderSongs(
    @Param('id', ParseUUIDPipe) playlistId: string,
    @Body(ValidationPipe) reorderDto: ReorderSongsDto,
    @CurrentUser() user: any,
  ): Promise<void> {
    this.logger.log(`🔄 PATCH /playlists/${playlistId}/songs/reorder - ${reorderDto.songs.length} canciones`);

    try {
      await this.playlistsService.reorderSongs(playlistId, reorderDto);

      this.logger.log(`✅ Canciones reordenadas exitosamente`);
    } catch (error) {
      this.logger.error(`❌ Error al reordenar canciones: ${error.message}`);
      throw error;
    }
  }

  // Regenerar playlist con nuevas canciones aleatorias (requiere autenticación)
  @Patch(':id/regenerate')
  @UseGuards(JwtAuthGuard)
  async regenerate(
    @Param('id', ParseUUIDPipe) playlistId: string,
    @CurrentUser() user: any,
  ): Promise<Playlist> {
    this.logger.log(`🔄 PATCH /playlists/${playlistId}/regenerate`);

    try {
      const playlist = await this.playlistsService.regeneratePlaylist(playlistId);

      this.logger.log(`✅ Playlist regenerada: "${playlist.name}"`);
      return playlist;
    } catch (error) {
      this.logger.error(`❌ Error al regenerar playlist: ${error.message}`);
      throw error;
    }
  }
}