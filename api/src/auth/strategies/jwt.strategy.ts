import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Primero intenta extraer de cookie
        (req: Request) => {
          const token = req?.cookies?.token_vibra;
          if (token) {
            this.logger.debug('Token extraído de cookie');
            return token;
          }
          return null;
        },
        // 2. Si no hay cookie, intenta del header Authorization: Bearer
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev_secret_only_for_local',
    });
    this.logger.log('JwtStrategy initialized');
  }

  async validate(payload: any) {
    this.logger.log(`Payload recibido en validate() con sub: ${payload.sub}`);
    // Podés agregar aquí más validaciones o buscar usuario en base de datos
    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
    };
  }
}
