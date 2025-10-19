import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { Playlist } from './entities/playlist.entity';
import { PlaylistSong } from './entities/playlist-song.entity';
import { Song } from '../music/entities/song.entity';
import { PlaylistsService } from './services/playlists.service';
import { PlaylistGeneratorService } from './services/playlist-generator.service';
import { PlaylistSchedulerService } from './services/playlist-scheduler.service';
import { PlaylistsController } from './controllers/playlists.controller';
import { MusicModule } from '../music/music.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Playlist, PlaylistSong, Song]),
    EventEmitterModule.forRoot(),
    MusicModule,
  ],
  controllers: [PlaylistsController],
  providers: [
    PlaylistsService,
    PlaylistGeneratorService,
    PlaylistSchedulerService,
  ],
  exports: [PlaylistsService, TypeOrmModule],
})
export class PlaylistsModule {}
