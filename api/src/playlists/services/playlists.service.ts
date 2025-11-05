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

    // IMPORTANTE: Si se especifica isPublic o userId, aplicar esos filtros
    if (isPublic !== undefined) {
      query.andWhere('playlist.isPublic = :isPublic', { isPublic });
    }

    if (userId) {
      query.andWhere('playlist.userId = :userId', { userId });
    }

    // SEGURIDAD: Si NO se especifica ningún filtro, solo devolver playlists públicas
    // Esto previene que se expongan playlists privadas de otros usuarios
    if (isPublic === undefined && !userId) {
      this.logger.warn('⚠️  No se especificó filtro - devolviendo solo playlists públicas por seguridad');
      query.andWhere('playlist.isPublic = :defaultPublic', { defaultPublic: true });
    }

    // Incluir las primeras 4 canciones para el mosaico
    query
      .leftJoinAndSelect('playlist.playlistSongs', 'playlistSong')
      .leftJoinAndSelect('playlistSong.song', 'song')
      .orderBy('playlist.displayOrder', 'ASC')
      .addOrderBy('playlist.updatedAt', 'DESC')
      .addOrderBy('playlistSong.position', 'ASC');

    const playlists = await query.getMany();

    // Limitar a solo las primeras 4 canciones por playlist (para el mosaico)
    playlists.forEach(playlist => {
      if (playlist.playlistSongs && playlist.playlistSongs.length > 4) {
        playlist.playlistSongs = playlist.playlistSongs.slice(0, 4);
      }
    });

    this.logger.log(`✅ Obtenidas ${playlists.length} playlists`);
    return playlists;
  }

  // Obtener playlist por ID con canciones
  async findOne(id: string, includeSongs: boolean = true, requestUserId?: string): Promise<Playlist> {
    this.logger.log(`🔍 Buscando playlist por ID: ${id} (incluir canciones: ${includeSongs}, usuario: ${requestUserId || 'anónimo'})`);

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

    // SEGURIDAD: Validar acceso a playlists privadas
    if (!playlist.isPublic) {
      // Si la playlist es privada, solo el dueño puede verla
      if (!requestUserId || playlist.userId !== requestUserId) {
        this.logger.warn(`🔒 Usuario no autorizado intentó acceder a playlist privada ${id}`);
        throw new NotFoundException(`Playlist con ID ${id} no encontrada`);
      }
    }

    // Transform to include songs array directly
    if (includeSongs && playlist.playlistSongs) {
      (playlist as any).songs = playlist.playlistSongs.map(ps => ps.song);
    }

    this.logger.log(`✅ Playlist encontrada: "${playlist.name}"`);
    return playlist;
  }

  // Actualizar playlist
  async update(id: string, updatePlaylistDto: UpdatePlaylistDto): Promise<Playlist> {
    this.logger.log(`🔄 Actualizando playlist: ${id}`);

    // No validar acceso aquí porque el controlador ya valida con JwtAuthGuard
    const playlist = await this.findOne(id, true, undefined);

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

    // No validar acceso aquí porque el controlador ya valida con JwtAuthGuard
    const playlist = await this.findOne(id, true, undefined);

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

  // Método helper: buscar canción (SOLO busca, NO crea)
  private async findOrCreateSong(addSongDto: AddSongToPlaylistDto): Promise<Song> {
    // 1. Si viene songId, buscar por ID en BD
    if (addSongDto.songId) {
      try {
        const song = await this.musicService.findSongById(addSongDto.songId);
        return song;
      } catch (error) {
        throw new NotFoundException(`Canción con ID ${addSongDto.songId} no encontrada en la base de datos`);
      }
    }

    // 2. Si viene youtubeId, buscar por YouTube ID en BD
    if (addSongDto.youtubeId) {
      const existingSong = await this.musicService.findSongByYoutubeId(addSongDto.youtubeId);
      if (existingSong) {
        return existingSong;
      }

      // 3. No está en BD - NO CREAR, lanzar error
      throw new NotFoundException(
        `Canción con YouTube ID ${addSongDto.youtubeId} no encontrada en la base de datos. ` +
        'Las playlists solo pueden contener canciones que ya existen en la base de datos.'
      );
    }

    // 4. No hay suficiente información
    throw new BadRequestException('Debe proporcionar songId o youtubeId');
  }

  // Agregar canción a playlist (lógica inteligente)
  async addSong(playlistId: string, addSongDto: AddSongToPlaylistDto): Promise<PlaylistSong> {
    return await this.dataSource.transaction(async (manager) => {
      // Verificar que la playlist existe
      const playlist = await manager.findOne(Playlist, { where: { id: playlistId } });
      if (!playlist) {
        throw new NotFoundException(`Playlist con ID ${playlistId} no encontrada`);
      }

      // Verificar límite de canciones (máximo 30)
      const currentSongCount = await manager.count(PlaylistSong, {
        where: { playlistId },
      });

      if (currentSongCount >= 30) {
        throw new BadRequestException('La playlist ha alcanzado el límite máximo de 30 canciones');
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

    // Verificar que la playlist existe (sin validación de acceso)
    await this.findOne(playlistId, true, undefined);

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
  }

  // Regenerar playlist (actualizar con nuevas canciones aleatorias)
  async regeneratePlaylist(playlistId: string): Promise<Playlist> {
    this.logger.log(`🔄 Regenerando playlist: ${playlistId}`);

    return await this.dataSource.transaction(async (manager) => {
      // Verificar que la playlist existe
      const playlist = await manager.findOne(Playlist, { where: { id: playlistId } });
      if (!playlist) {
        throw new NotFoundException(`Playlist con ID ${playlistId} no encontrada`);
      }

      // Solo regenerar playlists públicas (generadas automáticamente)
      if (!playlist.isPublic || playlist.userId) {
        throw new BadRequestException('Solo se pueden regenerar playlists automáticas');
      }

      // Eliminar todas las canciones actuales
      await manager.delete(PlaylistSong, { playlistId });

      // Obtener género de la playlist
      const genre = playlist.genre;
      if (!genre) {
        throw new BadRequestException('La playlist no tiene un género asignado');
      }

      // Obtener 24 canciones aleatorias del mismo género
      const randomSongs = await manager.query(`
        SELECT id, title, artist, duration
        FROM songs
        WHERE "cloudinaryUrl" IS NOT NULL
          AND genre = $1
        ORDER BY RANDOM()
        LIMIT 24
      `, [genre]);

      // Agregar las nuevas canciones
      let position = 1;
      for (const song of randomSongs) {
        const playlistSong = manager.create(PlaylistSong, {
          playlistId,
          songId: song.id,
          position: position++,
        });
        await manager.save(PlaylistSong, playlistSong);
      }

      // Actualizar contadores
      await this.updatePlaylistCounters(playlistId, manager);

      // Obtener playlist actualizada
      const updatedPlaylist = await manager.findOne(Playlist, { where: { id: playlistId } });

      if (!updatedPlaylist) {
        throw new NotFoundException(`No se pudo obtener la playlist actualizada`);
      }

      this.logger.log(`✅ Playlist regenerada: "${updatedPlaylist.name}" con ${randomSongs.length} canciones`);

      // Emitir evento
      this.eventEmitter.emit('playlist.regenerated', { playlistId });

      return updatedPlaylist;
    });
  }
}