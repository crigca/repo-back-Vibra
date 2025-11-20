import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';

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

  app.use(cookieParser()); // ✅ habilita el uso de cookies

  // CORS para frontend
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://vibra-kohl.vercel.app',
    
   

    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[]; // Elimina valores undefined/null

  app.enableCors({
    origin: allowedOrigins,
    credentials: true, // ⚠️ necesario para enviar cookies
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend corriendo en http://0.0.0.0:${port}`);
}
bootstrap();
