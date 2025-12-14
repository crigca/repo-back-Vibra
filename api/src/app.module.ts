import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { MusicModule } from './music/music.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { ImagesModule } from './images/images.module';
import { UsersModule } from './users/users.module';
import { UserHistoryModule } from './user-history/user-history.module';
import { UserFollowModule } from './user-follow/user-follow.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting - proteccion contra brute force
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 1 minuto
      limit: 20,   // 20 requests por minuto por IP (global)
    }]),

    // Módulo de Schedule para cron jobs
    ScheduleModule.forRoot(),

    // PostgreSQL - para datos estructurados
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL');

        // Si existe DATABASE_URL, usarla (producción)
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            ssl: { rejectUnauthorized: false },
            autoLoadEntities: true,
            synchronize: configService.get('NODE_ENV') !== 'production',
          };
        }

        // Si no, usar variables individuales (desarrollo)
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME'),
          ssl:
            configService.get('DB_SSL') === 'true'
              ? { rejectUnauthorized: false }
              : false,
          autoLoadEntities: true,
          synchronize: configService.get('NODE_ENV') !== 'production',
        };
      },
    }),

    // MongoDB - para datos flexibles
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URI'),
      }),
    }),

    // Módulos de la aplicación
    UsersModule,
    AuthModule,
    MusicModule,
    PlaylistsModule,
    ImagesModule,
    UserHistoryModule,
    UserFollowModule,
  ],
  providers: [
    // Activar rate limiting globalmente
    // TEMPORALMENTE DESACTIVADO - descomentar después del script
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}
