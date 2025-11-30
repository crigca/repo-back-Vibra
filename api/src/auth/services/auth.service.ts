import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { UserCredentials } from '../entities/user-credentials.entity';
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

interface AuthResponse {
  token: string;
}

interface RegisterResponse {
  message: string;
  requiresVerification: boolean;
}

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(UserCredentials)
        private readonly credentialsRepository: Repository<UserCredentials>,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
        private readonly emailService: EmailService,
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

            const { sub: googleId, email, name: username, email_verified, picture } = payload;

            if (!email || !email_verified) {
              throw new UnauthorizedException('Google account email not available or not verified');
            }

            // Buscar por googleId o email (evitar duplicados)
            let user = await this.userRepository.findOne({ where: [{ googleId }, { email }] });

            if (user && user.googleId && user.googleId !== googleId) {
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
                user.googleId = googleId;
                user.profileImage = picture;
                await this.userRepository.save(user);
            } else {
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

  // Generar codigo de verificacion de 6 digitos
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Registro con email y contraseña
  async register(email: string, password: string, username: string): Promise<RegisterResponse> {
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

    // Generar codigo de verificacion
    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Crear usuario primero
    const user = this.userRepository.create({
      email,
      username,
    });
    await this.userRepository.save(user);

    // Crear credenciales en tabla separada
    const credentials = this.credentialsRepository.create({
      userId: user.id,
      password: hashedPassword,
      emailVerified: false,
      verificationCode,
      verificationCodeExpires,
    });
    await this.credentialsRepository.save(credentials);

    // Enviar email de verificacion
    await this.emailService.sendVerificationEmail(email, verificationCode, username);

    return {
      message: 'Registro exitoso. Revisa tu email para verificar tu cuenta.',
      requiresVerification: true,
    };
  }

  // Verificar email con codigo
  async verifyEmail(email: string, code: string): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const credentials = await this.credentialsRepository.findOne({ where: { userId: user.id } });
    if (!credentials) {
      throw new BadRequestException('Este usuario no tiene credenciales de email');
    }

    if (credentials.emailVerified) {
      throw new BadRequestException('El email ya está verificado');
    }

    if (credentials.verificationCode !== code) {
      throw new BadRequestException('Código incorrecto');
    }

    if (!credentials.verificationCodeExpires || credentials.verificationCodeExpires < new Date()) {
      throw new BadRequestException('El código ha expirado. Solicita uno nuevo.');
    }

    // Marcar como verificado
    credentials.emailVerified = true;
    credentials.verificationCode = undefined;
    credentials.verificationCodeExpires = undefined;
    await this.credentialsRepository.save(credentials);

    // Generar JWT
    const payloadJwt = { sub: user.id, email: user.email, username: user.username };
    const token = this.jwtService.sign(payloadJwt, { expiresIn: '7d' });

    return { token };
  }

  // Reenviar codigo de verificacion
  async resendVerificationCode(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const credentials = await this.credentialsRepository.findOne({ where: { userId: user.id } });
    if (!credentials) {
      throw new BadRequestException('Este usuario no tiene credenciales de email');
    }

    if (credentials.emailVerified) {
      throw new BadRequestException('El email ya está verificado');
    }

    // Generar nuevo codigo
    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    credentials.verificationCode = verificationCode;
    credentials.verificationCodeExpires = verificationCodeExpires;
    await this.credentialsRepository.save(credentials);

    // Enviar email
    await this.emailService.sendVerificationEmail(email, verificationCode, user.username);

    return { message: 'Código reenviado. Revisa tu email.' };
  }

  // Solicitar recuperacion de contraseña
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    // No revelar si el email existe o no (seguridad)
    if (!user) {
      return { message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.' };
    }

    const credentials = await this.credentialsRepository.findOne({ where: { userId: user.id } });

    // Si no tiene credenciales, es usuario solo de Google
    if (!credentials) {
      return { message: 'Esta cuenta usa Google para iniciar sesión.' };
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    credentials.resetPasswordToken = resetToken;
    credentials.resetPasswordExpires = resetPasswordExpires;
    await this.credentialsRepository.save(credentials);

    // Enviar email
    await this.emailService.sendPasswordResetEmail(email, resetToken, user.username);

    return { message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.' };
  }

  // Restablecer contraseña con token
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    if (!token || !newPassword) {
      throw new BadRequestException('Token y nueva contraseña son requeridos');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
    }

    const credentials = await this.credentialsRepository.findOne({
      where: { resetPasswordToken: token },
      relations: ['user']
    });

    if (!credentials) {
      throw new BadRequestException('Token inválido o expirado');
    }

    if (!credentials.resetPasswordExpires || credentials.resetPasswordExpires < new Date()) {
      throw new BadRequestException('El token ha expirado. Solicita uno nuevo.');
    }

    // Hashear nueva contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    credentials.password = hashedPassword;
    credentials.resetPasswordToken = undefined;
    credentials.resetPasswordExpires = undefined;
    await this.credentialsRepository.save(credentials);

    return { message: 'Contraseña actualizada exitosamente' };
  }

  // Login con email y contraseña
  async login(email: string, password: string): Promise<AuthResponse> {
    if (!email || !password) {
      throw new BadRequestException('Email y contraseña son requeridos');
    }

    // Buscar usuario
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Buscar credenciales
    const credentials = await this.credentialsRepository.findOne({ where: { userId: user.id } });

    // Si no tiene credenciales, es usuario de Google
    if (!credentials) {
      throw new UnauthorizedException('Esta cuenta usa Google para iniciar sesión');
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, credentials.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Verificar que el email esté verificado
    if (!credentials.emailVerified) {
      throw new UnauthorizedException('Email no verificado. Revisa tu bandeja de entrada.');
    }

    // Generar JWT
    const payloadJwt = { sub: user.id, email: user.email, username: user.username };
    const token = this.jwtService.sign(payloadJwt, { expiresIn: '7d' });

    return { token };
  }
}
