import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { PlaylistSong } from './entities/playlist-song.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Playlist, PlaylistSong])
  ],
  exports: [TypeOrmModule]
})
export class PlaylistsModule {}