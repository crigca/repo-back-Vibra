import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Playlist } from '../entities/playlist.entity';
import { PlaylistSong } from '../entities/playlist-song.entity';
import { Song } from '../../music/entities/song.entity';
import { CreatePlaylistDto } from '../dto/create-playlist.dto';
import { UpdatePlaylistDto } from '../dto/update-playlist.dto';
import { AddSongToPlaylistDto } from '../dto/add-song-playlist.dto';
import { ReorderSongsDto } from '../dto/reorder-songs.dto';
import { MusicService } from '../../music/services/music.service';
import { CreateSongDto } from '../../music/dto/create-song.dto';

@Injectable()
export class PlaylistsService {
  private readonly logger = new Logger(PlaylistsService.name);

  constructor(
    @InjectRepository(Playlist)
    private playlistRepository: Repository<Playlist>,
    @InjectRepository(PlaylistSong)
    private playlistSongRepository: Repository<PlaylistSong>,
    @InjectRepository(Song)
    private songRepository: Repository<Song>,
    private dataSource: DataSource,
    private eventEmitter: EventEmitter2,
    private musicService: MusicService,
  ) {}

  // Crear nueva playlist
  async create(createPlaylistDto: CreatePlaylistDto, userId?: string): Promise<Playlist> {
    this.logger.log(
      `💾 Creando playlist: "${createPlaylistDto.name}" (usuario: ${userId || 'anónimo'})`,
    );

    try {
      const playlist = this.playlistRepository.create({
        ...createPlaylistDto,
        userId,
        songCount: 0,
        totalDuration: 0,
      });

      const savedPlaylist = await this.playlistRepository.save(playlist);

      this.logger.log(`✅ Playlist creada con ID: ${savedPlaylist.id}`);

      // Emitir evento
      this.eventEmitter.emit('playlist.created', { playlist: savedPlaylist });

      return savedPlaylist;
    } catch (error) {
      this.logger.error(`❌ Error al crear playlist: ${error.message}`);
      throw error;
    }
  }

  // Obtener todas las playlists
  async findAll(isPublic?: boolean, userId?: string): Promise<Playlist[]> {
    this.logger.log(`📋 Obteniendo playlists (público: ${isPublic}, usuario: ${userId})`);

    const query = this.playlistRepository.createQueryBuilder('playlist');

    if (isPublic !== undefined) {
      query.andWhere('playlist.isPublic = :isPublic', { isPublic });
    }

    if (userId) {
      query.andWhere('playlist.userId = :userId', { userId });
    }

    const playlists = await query
      .orderBy('playlist.updatedAt', 'DESC')
      .getMany();

    this.logger.log(`✅ Obtenidas ${playlists.length} playlists`);
    return playlists;
  }

  // Obtener playlist por ID con canciones
  async findOne(id: string, includeSongs: boolean = false): Promise<Playlist> {
    this.logger.log(`🔍 Buscando playlist por ID: ${id} (incluir canciones: ${includeSongs})`);

    const query = this.playlistRepository.createQueryBuilder('playlist')
      .where('playlist.id = :id', { id });

    if (includeSongs) {
      query
        .leftJoinAndSelect('playlist.playlistSongs', 'playlistSong')
        .leftJoinAndSelect('playlistSong.song', 'song')
        .orderBy('playlistSong.position', 'ASC');
    }

    const playlist = await query.getOne();

    if (!playlist) {
      this.logger.warn(`⚠️ Playlist no encontrada con ID: ${id}`);
      throw new NotFoundException(`Playlist con ID ${id} no encontrada`);
    }

    this.logger.log(`✅ Playlist encontrada: "${playlist.name}"`);
    return playlist;
  }

  // Actualizar playlist
  async update(id: string, updatePlaylistDto: UpdatePlaylistDto): Promise<Playlist> {
    this.logger.log(`🔄 Actualizando playlist: ${id}`);

    const playlist = await this.findOne(id);

    Object.assign(playlist, updatePlaylistDto);

    try {
      const updatedPlaylist = await this.playlistRepository.save(playlist);

      this.logger.log(`✅ Playlist actualizada: "${updatedPlaylist.name}"`);

      // Emitir evento
      this.eventEmitter.emit('playlist.updated', { playlist: updatedPlaylist });

      return updatedPlaylist;
    } catch (error) {
      this.logger.error(`❌ Error al actualizar playlist: ${error.message}`);
      throw error;
    }
  }

  // Eliminar playlist
  async remove(id: string): Promise<void> {
    this.logger.log(`🗑️ Eliminando playlist: ${id}`);

    const playlist = await this.findOne(id);

    try {
      await this.playlistRepository.remove(playlist);

      this.logger.log(`✅ Playlist eliminada: "${playlist.name}"`);

      // Emitir evento
      this.eventEmitter.emit('playlist.deleted', { playlistId: id });
    } catch (error) {
      this.logger.error(`❌ Error al eliminar playlist: ${error.message}`);
      throw error;
    }
  }

  // Método helper: buscar o crear canción
  private async findOrCreateSong(addSongDto: AddSongToPlaylistDto): Promise<Song> {
    this.logger.log(`🔍 Buscando o creando canción`);

    // 1. Si viene songId, buscar por ID en BD
    if (addSongDto.songId) {
      this.logger.log(`🔍 Buscando por songId: ${addSongDto.songId}`);
      try {
        const song = await this.musicService.findSongById(addSongDto.songId);
        this.logger.log(`✅ Canción encontrada en BD por ID: "${song.title}"`);
        return song;
      } catch (error) {
        this.logger.log(`⚠️ SongId no encontrado, continuando con youtubeId`);
      }
    }

    // 2. Si viene youtubeId, buscar por YouTube ID en BD
    if (addSongDto.youtubeId) {
      this.logger.log(`🔍 Buscando por youtubeId en BD: ${addSongDto.youtubeId}`);

      const existingSong = await this.musicService.findSongByYoutubeId(addSongDto.youtubeId);
      if (existingSong) {
        this.logger.log(`✅ Canción encontrada en BD por youtubeId: "${existingSong.title}"`);
        return existingSong;
      }

      // 3. No está en BD, buscar en YouTube API
      this.logger.log(`🔍 No encontrada en BD, buscando en YouTube API: ${addSongDto.youtubeId}`);

      try {
        const youtubeVideo = await this.musicService.getYouTubeVideoById(addSongDto.youtubeId);

        if (!youtubeVideo) {
          throw new BadRequestException(`Video con ID ${addSongDto.youtubeId} no encontrado en YouTube`);
        }

        // 4. Crear nueva canción con datos de YouTube API
        this.logger.log(`💾 Creando nueva canción desde YouTube API: "${youtubeVideo.title}"`);

        const createSongDto: CreateSongDto = {
          title: addSongDto.title || youtubeVideo.title,
          artist: addSongDto.artist || youtubeVideo.artist,
          youtubeId: addSongDto.youtubeId,
          duration: addSongDto.duration || youtubeVideo.duration,
          genre: addSongDto.genre,
          publishedAt: youtubeVideo.publishedAt,
          viewCount: youtubeVideo.viewCount,
        };

        const newSong = await this.musicService.createSong(createSongDto);
        this.logger.log(`✅ Nueva canción creada desde YouTube: "${newSong.title}" - ID: ${newSong.id}`);
        return newSong;

      } catch (error) {
        this.logger.error(`❌ Error al obtener datos de YouTube: ${error.message}`);

        // 5. Fallback: usar metadatos manuales si están disponibles
        if (addSongDto.title && addSongDto.artist && addSongDto.duration) {
          this.logger.log(`🔄 Fallback: usando metadatos manuales para crear canción`);

          const createSongDto: CreateSongDto = {
            title: addSongDto.title,
            artist: addSongDto.artist,
            youtubeId: addSongDto.youtubeId,
            duration: addSongDto.duration,
            genre: addSongDto.genre,
          };

          const newSong = await this.musicService.createSong(createSongDto);
          this.logger.log(`✅ Nueva canción creada con metadatos manuales: "${newSong.title}"`);
          return newSong;
        }

        throw new BadRequestException(
          `No se pudo obtener información del video ${addSongDto.youtubeId} desde YouTube. ` +
          'Proporcione title, artist y duration manualmente.'
        );
      }
    }

    // 6. No hay suficiente información
    throw new BadRequestException('Debe proporcionar songId o youtubeId');
  }

  // Agregar canción a playlist (lógica inteligente)
  async addSong(playlistId: string, addSongDto: AddSongToPlaylistDto): Promise<PlaylistSong> {
    this.logger.log(`🎵 Agregando canción a playlist ${playlistId}`);

    return await this.dataSource.transaction(async (manager) => {
      // Verificar que la playlist existe
      const playlist = await manager.findOne(Playlist, { where: { id: playlistId } });
      if (!playlist) {
        throw new NotFoundException(`Playlist con ID ${playlistId} no encontrada`);
      }

      // Verificar límite de canciones (máximo 15)
      const currentSongCount = await manager.count(PlaylistSong, {
        where: { playlistId },
      });

      if (currentSongCount >= 15) {
        throw new BadRequestException('La playlist ha alcanzado el límite máximo de 15 canciones');
      }

      // Buscar o crear la canción
      const song = await this.findOrCreateSong(addSongDto);

      // Verificar que la canción no esté ya en la playlist
      const existingPlaylistSong = await manager.findOne(PlaylistSong, {
        where: { playlistId, songId: song.id },
      });

      if (existingPlaylistSong) {
        throw new ConflictException('La canción ya está en la playlist');
      }

      // Determinar posición
      let position = addSongDto.position;
      if (!position) {
        const lastPosition = await manager
          .createQueryBuilder(PlaylistSong, 'ps')
          .select('MAX(ps.position)', 'maxPosition')
          .where('ps.playlistId = :playlistId', { playlistId })
          .getRawOne();

        position = (lastPosition?.maxPosition || 0) + 1;
      } else {
        // Si se especifica posición, reajustar las posteriores
        await manager
          .createQueryBuilder()
          .update(PlaylistSong)
          .set({ position: () => 'position + 1' })
          .where('playlistId = :playlistId AND position >= :position', { playlistId, position })
          .execute();
      }

      // Crear PlaylistSong
      const playlistSong = manager.create(PlaylistSong, {
        playlistId,
        songId: song.id,
        position,
      });

      const savedPlaylistSong = await manager.save(PlaylistSong, playlistSong);

      // Actualizar contadores de la playlist
      await this.updatePlaylistCounters(playlistId, manager);

      this.logger.log(`✅ Canción "${song.title}" agregada en posición ${position}`);

      // Emitir evento
      this.eventEmitter.emit('playlist.songAdded', {
        playlistId,
        songId: song.id,
        position,
      });

      return savedPlaylistSong;
    });
  }

  // Remover canción de playlist
  async removeSong(playlistId: string, songId: string): Promise<void> {
    this.logger.log(`🗑️ Removiendo canción ${songId} de playlist ${playlistId}`);

    return await this.dataSource.transaction(async (manager) => {
      // Verificar que la playlist existe
      const playlist = await manager.findOne(Playlist, { where: { id: playlistId } });
      if (!playlist) {
        throw new NotFoundException(`Playlist con ID ${playlistId} no encontrada`);
      }

      // Buscar la canción en la playlist
      const playlistSong = await manager.findOne(PlaylistSong, {
        where: { playlistId, songId },
      });

      if (!playlistSong) {
        throw new NotFoundException('La canción no está en la playlist');
      }

      const removedPosition = playlistSong.position;

      // Eliminar la canción
      await manager.remove(PlaylistSong, playlistSong);

      // Reajustar posiciones posteriores
      await manager
        .createQueryBuilder()
        .update(PlaylistSong)
        .set({ position: () => 'position - 1' })
        .where('playlistId = :playlistId AND position > :position', {
          playlistId,
          position: removedPosition,
        })
        .execute();

      // Actualizar contadores
      await this.updatePlaylistCounters(playlistId, manager);

      this.logger.log(`✅ Canción removida de posición ${removedPosition}`);

      // Emitir evento
      this.eventEmitter.emit('playlist.songRemoved', {
        playlistId,
        songId,
        position: removedPosition,
      });
    });
  }

  // Reordenar canciones en playlist
  async reorderSongs(playlistId: string, reorderDto: ReorderSongsDto): Promise<void> {
    this.logger.log(`🔄 Reordenando ${reorderDto.songs.length} canciones en playlist ${playlistId}`);

    return await this.dataSource.transaction(async (manager) => {
      // Verificar que la playlist existe
      const playlist = await manager.findOne(Playlist, { where: { id: playlistId } });
      if (!playlist) {
        throw new NotFoundException(`Playlist con ID ${playlistId} no encontrada`);
      }

      // Validar que todas las canciones están en la playlist
      const songIds = reorderDto.songs.map(s => s.songId);
      const playlistSongs = await manager.find(PlaylistSong, {
        where: { playlistId, songId: { $in: songIds } as any },
      });

      if (playlistSongs.length !== songIds.length) {
        throw new BadRequestException('Una o más canciones no están en la playlist');
      }

      // Validar que no hay positions duplicadas
      const positions = reorderDto.songs.map(s => s.position);
      const uniquePositions = new Set(positions);
      if (uniquePositions.size !== positions.length) {
        throw new BadRequestException('No se permiten posiciones duplicadas');
      }

      // Actualizar posiciones
      for (const songPosition of reorderDto.songs) {
        await manager.update(
          PlaylistSong,
          { playlistId, songId: songPosition.songId },
          { position: songPosition.position }
        );
      }

      this.logger.log('✅ Canciones reordenadas exitosamente');

      // Emitir evento
      this.eventEmitter.emit('playlist.songsReordered', {
        playlistId,
        newOrder: reorderDto.songs,
      });
    });
  }

  // Obtener canciones de una playlist
  async getPlaylistSongs(playlistId: string): Promise<PlaylistSong[]> {
    this.logger.log(`🎵 Obteniendo canciones de playlist: ${playlistId}`);

    // Verificar que la playlist existe
    await this.findOne(playlistId);

    const playlistSongs = await this.playlistSongRepository.find({
      where: { playlistId },
      relations: ['song'],
      order: { position: 'ASC' },
    });

    this.logger.log(`✅ Obtenidas ${playlistSongs.length} canciones`);
    return playlistSongs;
  }

  // Método privado para actualizar contadores de playlist
  private async updatePlaylistCounters(playlistId: string, manager?: any) {
    let queryBuilder;

    if (manager) {
      // Usar el manager de transacción
      queryBuilder = manager
        .createQueryBuilder(PlaylistSong, 'ps')
        .select([
          'COUNT(ps.id) as songCount',
          'COALESCE(SUM(song.duration), 0) as totalDuration'
        ])
        .leftJoin('ps.song', 'song')
        .where('ps.playlistId = :playlistId', { playlistId });
    } else {
      // Usar el repository normal
      queryBuilder = this.playlistSongRepository
        .createQueryBuilder('ps')
        .select([
          'COUNT(ps.id) as songCount',
          'COALESCE(SUM(song.duration), 0) as totalDuration'
        ])
        .leftJoin('ps.song', 'song')
        .where('ps.playlistId = :playlistId', { playlistId });
    }

    const stats = await queryBuilder.getRawOne();

    if (manager) {
      await manager.update(Playlist, { id: playlistId }, {
        songCount: parseInt(stats.songCount) || 0,
        totalDuration: parseInt(stats.totalDuration) || 0,
      });
    } else {
      await this.playlistRepository.update(
        { id: playlistId },
        {
          songCount: parseInt(stats.songCount) || 0,
          totalDuration: parseInt(stats.totalDuration) || 0,
        }
      );
    }

    this.logger.log(`📊 Contadores actualizados: ${stats.songCount} canciones, ${stats.totalDuration}s total`);
  }
}