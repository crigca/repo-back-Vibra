import { Test, TestingModule } from '@nestjs/testing';
import { PlaylistsService } from './playlists.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Playlist } from '../entities/playlist.entity';
import { PlaylistSong } from '../entities/playlist-song.entity';
import { Song } from '../../music/entities/song.entity';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MusicService } from '../../music/services/music.service';
import { BadRequestException } from '@nestjs/common';

describe('PlaylistsService', () => {
  let service: PlaylistsService;

  // ========================================
  // MOCKS - Objetos falsos que simulan la BD
  // ========================================

  // Este mock simula el Repository de Playlist
  const mockPlaylistRepository = {
    count: jest.fn(),      // Simula contar playlists
    findOne: jest.fn(),    // Simula buscar una playlist
    create: jest.fn(),     // Simula crear objeto playlist
    save: jest.fn(),       // Simula guardar en BD
  };

  // Mock del Repository de PlaylistSong
  const mockPlaylistSongRepository = {
    find: jest.fn(),
    count: jest.fn(),
  };

  // Mock del Repository de Song
  const mockSongRepository = {
    findOne: jest.fn(),
  };

  // Mock del DataSource (para transacciones)
  const mockDataSource = {
    transaction: jest.fn(),
  };

  // Mock del EventEmitter (para eventos)
  const mockEventEmitter = {
    emit: jest.fn(),
  };

  // Mock del MusicService
  const mockMusicService = {
    findSongById: jest.fn(),
    findSongByYoutubeId: jest.fn(),
  };

  // ========================================
  // SETUP - Se ejecuta ANTES de cada test
  // ========================================
  beforeEach(async () => {
    // Crear módulo de testing con todos los mocks
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaylistsService,
        {
          provide: getRepositoryToken(Playlist),
          useValue: mockPlaylistRepository,
        },
        {
          provide: getRepositoryToken(PlaylistSong),
          useValue: mockPlaylistSongRepository,
        },
        {
          provide: getRepositoryToken(Song),
          useValue: mockSongRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: MusicService,
          useValue: mockMusicService,
        },
      ],
    }).compile();

    service = module.get<PlaylistsService>(PlaylistsService);

    // Limpiar todos los mocks antes de cada test
    jest.clearAllMocks();
  });

  // ========================================
  // TEST 1: Verificar que el servicio existe
  // ========================================
  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  // ========================================
  // GRUPO DE TESTS: Método create()
  // ========================================
  describe('create', () => {

    // --------------------------------------
    // TEST 2: Crear playlist exitosamente
    // --------------------------------------
    it('debe crear una playlist cuando el usuario tiene menos de 15', async () => {
      // 1️⃣ PREPARAR (Arrange)
      const userId = 'user-123';
      const createDto = { name: 'Mi Playlist Rock' };

      // Simular que el usuario tiene 5 playlists (menos de 15)
      mockPlaylistRepository.count.mockResolvedValue(5);

      // Simular que NO existe playlist con ese nombre
      mockPlaylistRepository.findOne.mockResolvedValue(null);

      // Simular la creación del objeto
      const playlistCreada = {
        id: 'playlist-456',
        name: 'Mi Playlist Rock',
        userId: 'user-123',
        songCount: 0,
        totalDuration: 0,
      };
      mockPlaylistRepository.create.mockReturnValue(playlistCreada);
      mockPlaylistRepository.save.mockResolvedValue(playlistCreada);

      // 2️⃣ EJECUTAR (Act)
      const resultado = await service.create(createDto, userId);

      // 3️⃣ VERIFICAR (Assert)
      expect(resultado).toBeDefined();
      expect(resultado.name).toBe('Mi Playlist Rock');
      expect(resultado.userId).toBe('user-123');

      // Verificar que se llamaron los métodos correctos
      expect(mockPlaylistRepository.count).toHaveBeenCalledWith({
        where: { userId, isPublic: false },
      });
      expect(mockPlaylistRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'playlist.created',
        expect.any(Object)
      );
    });

    // --------------------------------------
    // TEST 3: Rechazar si tiene 15 playlists
    // --------------------------------------
    it('debe rechazar cuando el usuario ya tiene 15 playlists', async () => {
      // 1️⃣ PREPARAR
      const userId = 'user-123';
      const createDto = { name: 'Playlist Nueva' };

      // Simular que el usuario YA tiene 15 playlists (el límite)
      mockPlaylistRepository.count.mockResolvedValue(15);

      // 2️⃣ EJECUTAR y 3️⃣ VERIFICAR
      // Esperamos que lance un error BadRequestException
      await expect(
        service.create(createDto, userId)
      ).rejects.toThrow(BadRequestException);

      // Verificar el mensaje de error específico
      await expect(
        service.create(createDto, userId)
      ).rejects.toThrow('Has alcanzado el límite de 15 playlists');

      // Verificar que NO se guardó nada
      expect(mockPlaylistRepository.save).not.toHaveBeenCalled();
    });

    // --------------------------------------
    // TEST 4: Rechazar nombre duplicado
    // --------------------------------------
    it('debe rechazar si ya existe una playlist con ese nombre', async () => {
      // 1️⃣ PREPARAR
      const userId = 'user-123';
      const createDto = { name: 'Rock Hits' };

      // Usuario tiene solo 3 playlists (OK)
      mockPlaylistRepository.count.mockResolvedValue(3);

      // PERO ya existe una playlist con ese nombre
      mockPlaylistRepository.findOne.mockResolvedValue({
        id: 'playlist-existente',
        name: 'Rock Hits',
        userId: 'user-123',
      });

      // 2️⃣ EJECUTAR y 3️⃣ VERIFICAR
      await expect(
        service.create(createDto, userId)
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(createDto, userId)
      ).rejects.toThrow('Ya tienes una playlist con ese nombre');

      // Verificar que NO se guardó
      expect(mockPlaylistRepository.save).not.toHaveBeenCalled();
    });

    // --------------------------------------
    // TEST 5: Permitir crear sin userId (anónimo)
    // --------------------------------------
    it('debe permitir crear playlist sin userId', async () => {
      // 1️⃣ PREPARAR
      const createDto = { name: 'Playlist Pública', isPublic: true };

      const playlistCreada = {
        id: 'playlist-789',
        name: 'Playlist Pública',
        userId: undefined,
        isPublic: true,
        songCount: 0,
      };
      mockPlaylistRepository.create.mockReturnValue(playlistCreada);
      mockPlaylistRepository.save.mockResolvedValue(playlistCreada);

      // 2️⃣ EJECUTAR (sin userId)
      const resultado = await service.create(createDto);

      // 3️⃣ VERIFICAR
      expect(resultado.name).toBe('Playlist Pública');

      // NO debe verificar límites si no hay userId
      expect(mockPlaylistRepository.count).not.toHaveBeenCalled();
    });

  });
});
