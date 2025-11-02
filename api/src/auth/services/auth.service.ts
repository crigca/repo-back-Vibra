import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

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

            const { sub: googleId, email, name: username, email_verified } = payload;

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
                });
                await this.userRepository.save(user);
            } else if (!user.googleId) {
                // vincular cuenta si email existente sin googleId
                user.googleId = googleId;
                await this.userRepository.save(user);
            }

            const payloadJwt = { sub: user.id, email: user.email, username: user.username  };
            const token = this.jwtService.sign(payloadJwt, {
                expiresIn: '7d',
            });

            return { token };
        } catch (error) {
            // console.error('Google auth error:', error.message ?? error);
            // ← Agregá esto para ver el error real
            console.error('ERROR COMPLETO:', error);
            console.error('MENSAJE:', error.message);
            
            if (error instanceof UnauthorizedException || 
                error instanceof ConflictException) {
                throw error;
            }
            throw new UnauthorizedException('Authentication failed');
            // throw new UnauthorizedException('Google authentication failed');
        }
    }

  signJwtForDev(payload: any): string {
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }
}
