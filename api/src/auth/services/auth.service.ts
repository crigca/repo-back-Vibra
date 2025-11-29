import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

interface AuthResponse {
  token: string;
}

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) {}

    private createGoogleClient() {
      return new OAuth2Client(this.config.get<string>('GOOGLE_CLIENT_ID'));
    }

    async authenticateWithGoogle(idToken: string): Promise<AuthResponse> {
        try {
            const client = this.createGoogleClient();
            const ticket = await client.verifyIdToken({
                idToken,
                audience: this.config.get<string>('GOOGLE_CLIENT_ID'),
            });

            const payload = ticket.getPayload();
            if (!payload) throw new UnauthorizedException('Invalid Google ID token');

            const { sub: googleId, email, name: username, email_verified,picture } = payload;

            if (!email || !email_verified) {
              throw new UnauthorizedException('Google account email not available or not verified');
            }

            // Buscar por googleId o email (evitar duplicados)
            let user = await this.userRepository.findOne({ where: [{ googleId }, { email }] });

            if (user && user.googleId && user.googleId !== googleId) {
              // caso improbable: email ya existe con otro googleId -> manejar según política
              throw new ConflictException('Email already in use with different provider');
            }

            if (!user) {
                user = this.userRepository.create({
                  googleId,
                  email,
                  username: username ?? email.split('@')[0],
                  profileImage: picture,
                });
                await this.userRepository.save(user);
            } else if (!user.googleId) {
                // vincular cuenta si email existente sin googleId
                user.googleId = googleId;
                user.profileImage = picture;
                await this.userRepository.save(user);
            }else {
              // ✅ ya tiene Google vinculado, actualizar la foto por si cambió
              user.profileImage = picture;
              await this.userRepository.save(user);
            }

            const payloadJwt = { sub: user.id, email: user.email, username: user.username };
            const token = this.jwtService.sign(payloadJwt, {
                expiresIn: '7d',
            });

            return { token };
        } catch (error) {
            if (error instanceof UnauthorizedException ||
                error instanceof ConflictException) {
                throw error;
            }
            throw new UnauthorizedException('Authentication failed');
        }
    }

  signJwtForDev(payload: any): string {
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  // ✅ Registro con email y contraseña
  async register(email: string, password: string, username: string): Promise<AuthResponse> {
    // Validaciones básicas
    if (!email || !password || !username) {
      throw new BadRequestException('Email, contraseña y username son requeridos');
    }

    if (password.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
    }

    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hashear contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const user = this.userRepository.create({
      email,
      username,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    // Generar JWT
    const payloadJwt = { sub: user.id, email: user.email, username: user.username };
    const token = this.jwtService.sign(payloadJwt, { expiresIn: '7d' });

    return { token };
  }

  // ✅ Login con email y contraseña
  async login(email: string, password: string): Promise<AuthResponse> {
    if (!email || !password) {
      throw new BadRequestException('Email y contraseña son requeridos');
    }

    // Buscar usuario
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Verificar que tenga contraseña (puede ser usuario de Google)
    if (!user.password) {
      throw new UnauthorizedException('Esta cuenta usa Google para iniciar sesión');
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Generar JWT
    const payloadJwt = { sub: user.id, email: user.email, username: user.username };
    const token = this.jwtService.sign(payloadJwt, { expiresIn: '7d' });

    return { token };
  }
}
