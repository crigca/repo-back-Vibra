import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../users/entities/users.entity';
import { UserCredentials } from '../entities/user-credentials.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  // Mocks
  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCredentialsRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('fake-jwt-token'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('fake-config-value'),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(UserCredentials), useValue: mockCredentialsRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ========================================
  // TEST: Servicio existe
  // ========================================
  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  // ========================================
  // TESTS: Registro
  // ========================================
  describe('register', () => {

    it('debe rechazar contraseña menor a 6 caracteres', async () => {
      await expect(
        service.register('test@email.com', '12345', 'testuser')
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.register('test@email.com', '12345', 'testuser')
      ).rejects.toThrow('La contraseña debe tener al menos 6 caracteres');
    });

    it('debe rechazar si falta email, password o username', async () => {
      await expect(
        service.register('', 'password123', 'testuser')
      ).rejects.toThrow('Email, contraseña y username son requeridos');

      await expect(
        service.register('test@email.com', '', 'testuser')
      ).rejects.toThrow('Email, contraseña y username son requeridos');

      await expect(
        service.register('test@email.com', 'password123', '')
      ).rejects.toThrow('Email, contraseña y username son requeridos');
    });

    it('debe rechazar si el email ya existe', async () => {
      // Simular que el email ya existe
      mockUserRepository.findOne.mockResolvedValue({
        id: 'existing-user',
        email: 'test@email.com',
      });

      await expect(
        service.register('test@email.com', 'password123', 'testuser')
      ).rejects.toThrow(ConflictException);

      await expect(
        service.register('test@email.com', 'password123', 'testuser')
      ).rejects.toThrow('El email ya está registrado');
    });

    it('debe registrar usuario exitosamente', async () => {
      // Email no existe
      mockUserRepository.findOne.mockResolvedValue(null);

      // Simular creación
      mockUserRepository.create.mockReturnValue({
        id: 'new-user-id',
        email: 'nuevo@email.com',
        username: 'nuevouser',
      });
      mockUserRepository.save.mockResolvedValue({
        id: 'new-user-id',
        email: 'nuevo@email.com',
        username: 'nuevouser',
      });
      mockCredentialsRepository.create.mockReturnValue({});
      mockCredentialsRepository.save.mockResolvedValue({});

      const resultado = await service.register(
        'nuevo@email.com',
        'password123',
        'nuevouser'
      );

      expect(resultado.requiresVerification).toBe(true);
      expect(resultado.message).toContain('Registro exitoso');
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

  });

  // ========================================
  // TESTS: Login
  // ========================================
  describe('login', () => {

    it('debe rechazar si falta email o password', async () => {
      await expect(
        service.login('', 'password123')
      ).rejects.toThrow('Email y contraseña son requeridos');

      await expect(
        service.login('test@email.com', '')
      ).rejects.toThrow('Email y contraseña son requeridos');
    });

    it('debe rechazar si el usuario no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login('noexiste@email.com', 'password123')
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        service.login('noexiste@email.com', 'password123')
      ).rejects.toThrow('Credenciales incorrectas');
    });

    it('debe rechazar si el email no está verificado', async () => {
      // Usuario existe
      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-123',
        email: 'test@email.com',
      });

      // Credenciales existen pero email no verificado
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockCredentialsRepository.findOne.mockResolvedValue({
        userId: 'user-123',
        password: hashedPassword,
        emailVerified: false,  // <-- No verificado
      });

      await expect(
        service.login('test@email.com', 'password123')
      ).rejects.toThrow('Email no verificado');
    });

    it('debe hacer login exitosamente', async () => {
      // Usuario existe
      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-123',
        email: 'test@email.com',
        username: 'testuser',
      });

      // Credenciales válidas y verificadas
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockCredentialsRepository.findOne.mockResolvedValue({
        userId: 'user-123',
        password: hashedPassword,
        emailVerified: true,
      });

      const resultado = await service.login('test@email.com', 'password123');

      expect(resultado.token).toBe('fake-jwt-token');
      expect(mockJwtService.sign).toHaveBeenCalled();
    });

  });

  // ========================================
  // TESTS: Reset Password
  // ========================================
  describe('resetPassword', () => {

    it('debe rechazar contraseña menor a 6 caracteres', async () => {
      await expect(
        service.resetPassword('valid-token', '12345')
      ).rejects.toThrow('La contraseña debe tener al menos 6 caracteres');
    });

    it('debe rechazar si falta token o password', async () => {
      await expect(
        service.resetPassword('', 'password123')
      ).rejects.toThrow('Token y nueva contraseña son requeridos');

      await expect(
        service.resetPassword('valid-token', '')
      ).rejects.toThrow('Token y nueva contraseña son requeridos');
    });

  });

});
