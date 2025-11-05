import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador para obtener el usuario actual de forma opcional
 * (no lanza error si no hay usuario autenticado)
 */
export const OptionalUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user || null; // Devuelve null si no hay usuario autenticado
  },
);
