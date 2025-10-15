import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ValidationPipe global (whitelist, forbidNonWhitelisted)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Solo permite propiedades definidas en DTOs
      forbidNonWhitelisted: true, // Rechaza propiedades no permitidas
      transform: true, // Transforma automáticamente tipos
    }),
  );

  // Servir archivos estáticos desde la carpeta public
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // CORS para frontend futuro
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
