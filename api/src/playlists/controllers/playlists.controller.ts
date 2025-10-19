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
} from '@nestjs/common';

import { PlaylistsService } from '../services/playlists.service';
import { CreatePlaylistDto } from '../dto/create-playlist.dto';
import { UpdatePlaylistDto } from '../dto/update-playlist.dto';
import { AddSongToPlaylistDto } from '../dto/add-song-playlist.dto';
import { ReorderSongsDto } from '../dto/reorder-songs.dto';
import { Playlist } from '../entities/playlist.entity';
import { PlaylistSong } from '../entities/playlist-song.entity';

@Controller('playlists')
export class PlaylistsController {
  private readonly logger = new Logger(PlaylistsController.name);

  constructor(private readonly playlistsService: PlaylistsService) {}

  // ============= CRUD BÁSICO DE PLAYLISTS =============

  // Crear nueva playlist
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createPlaylistDto: CreatePlaylistDto,
    @Query('userId') userId?: string,
  ): Promise<Playlist> {
    this.logger.log(`💾 POST /playlists - Nombre: "${createPlaylistDto.name}"`);

    try {
      const playlist = await this.playlistsService.create(createPlaylistDto, userId);

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

  // Obtener playlist por ID
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeSongs', new ParseBoolPipe({ optional: true })) includeSongs?: boolean,
  ): Promise<Playlist> {
    this.logger.log(`🔍 GET /playlists/${id} - Incluir canciones: ${includeSongs}`);

    try {
      const playlist = await this.playlistsService.findOne(id, includeSongs);

      this.logger.log(`✅ Playlist encontrada: "${playlist.name}"`);
      return playlist;
    } catch (error) {
      this.logger.error(`❌ Error al buscar playlist: ${error.message}`);
      throw error;
    }
  }

  // Actualizar playlist
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updatePlaylistDto: UpdatePlaylistDto,
  ): Promise<Playlist> {
    this.logger.log(`🔄 PUT /playlists/${id}`);

    try {
      const playlist = await this.playlistsService.update(id, updatePlaylistDto);

      this.logger.log(`✅ Playlist actualizada: "${playlist.name}"`);
      return playlist;
    } catch (error) {
      this.logger.error(`❌ Error al actualizar playlist: ${error.message}`);
      throw error;
    }
  }

  // Eliminar playlist
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    this.logger.log(`🗑️ DELETE /playlists/${id}`);

    try {
      await this.playlistsService.remove(id);

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

  // Agregar canción a playlist
  @Post(':id/songs')
  @HttpCode(HttpStatus.CREATED)
  async addSong(
    @Param('id', ParseUUIDPipe) playlistId: string,
    @Body(ValidationPipe) addSongDto: AddSongToPlaylistDto,
  ): Promise<PlaylistSong> {
    this.logger.log(`🎵 POST /playlists/${playlistId}/songs - Canción: ${addSongDto.songId}`);

    try {
      const playlistSong = await this.playlistsService.addSong(playlistId, addSongDto);

      this.logger.log(`✅ Canción agregada en posición ${playlistSong.position}`);
      return playlistSong;
    } catch (error) {
      this.logger.error(`❌ Error al agregar canción: ${error.message}`);
      throw error;
    }
  }

  // Remover canción específica de playlist
  @Delete(':id/songs/:songId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSong(
    @Param('id', ParseUUIDPipe) playlistId: string,
    @Param('songId', ParseUUIDPipe) songId: string,
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

  // Reordenar canciones en playlist
  @Patch(':id/songs/reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorderSongs(
    @Param('id', ParseUUIDPipe) playlistId: string,
    @Body(ValidationPipe) reorderDto: ReorderSongsDto,
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

  // Regenerar playlist con nuevas canciones aleatorias
  @Patch(':id/regenerate')
  async regenerate(@Param('id', ParseUUIDPipe) playlistId: string): Promise<Playlist> {
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