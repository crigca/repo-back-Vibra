// src/auth/optional-jwt-auth.guard.ts
import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JWT Opcional
 *
 * A diferencia de JwtAuthGuard, este guard:
 * - Intenta autenticar al usuario si hay token
 * - NO falla si no hay token (permite acceso anónimo)
 * - Puebla request.user si el token es válido
 *
 * Útil para endpoints que permiten acceso público pero necesitan
 * saber si el usuario está autenticado para mostrar contenido personalizado
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(OptionalJwtAuthGuard.name);

  /**
   * Sobrescribe canActivate para siempre permitir acceso
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Intenta autenticar, pero ignora errores
    try {
      const result = await super.canActivate(context);
      this.logger.debug(`✅ Autenticación exitosa: ${result}`);
      return true;
    } catch (error) {
      // Ignora errores de autenticación (permite acceso anónimo)
      this.logger.debug(`⚠️  Sin autenticación (permitiendo acceso anónimo): ${error.message}`);
      return true;
    }
  }

  /**
   * Sobrescribe handleRequest para NO lanzar error si no hay usuario
   */
  handleRequest(err: any, user: any, info: any) {
    // Si hay usuario válido, retornarlo
    if (user) {
      this.logger.debug(`👤 Usuario autenticado: ${user.userId}`);
      return user;
    }

    // Si hay error o no hay usuario, retornar null (acceso anónimo)
    this.logger.debug(`🔓 Acceso anónimo permitido`);
    return null;
  }
}
