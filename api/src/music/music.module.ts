import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Song } from './entities/song.entity';
import { MusicService } from './services/music.service';
import { YoutubeService } from './services/youtube.service';
import { MusicController } from './controllers/music.controller';

/**
 * Módulo de música con integración de YouTube
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Song]),
    ConfigModule,
    EventEmitterModule.forRoot()
  ],
  controllers: [MusicController],
  providers: [MusicService, YoutubeService],
  exports: [MusicService, YoutubeService]
})
export class MusicModule {}