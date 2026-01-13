import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Song } from './entities/song.entity';
import { MusicService } from './services/music.service';
import { YoutubeService } from './services/youtube.service';
import { GenreDetectorService } from './services/genre-detector.service';
import { MusicController } from './controllers/music.controller';

/**
 * Módulo de música con integración de YouTube
 * Audio: R2 storage (Cloudflare)
 * Imágenes: CloudinaryService (via ImagesModule en AppModule)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Song]),
    ConfigModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [MusicController],
  providers: [MusicService, YoutubeService, GenreDetectorService],
  exports: [MusicService, YoutubeService, GenreDetectorService],
})
export class MusicModule {}
