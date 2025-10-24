import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fG7r1bJkPz5WmL0vQ8Yd3cXwA2Tn9sKjRi4ZuN6h',
    });
  }

  async validate(payload: any) {
    // Aquí podrías validar el usuario con la carga útil o hacer fetch adicional
    return { userId: payload.sub, username: payload.username };
  }
}