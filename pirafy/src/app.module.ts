import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { HistoryModule } from './history/history.module';
import { PlaylistModule } from './playlist/playlist.module';
import { PlaylistModule } from './playlist/playlist.module';
import { HistoryModule } from './history/history.module';

@Module({
  imports: [UsersModule, HistoryModule, PlaylistModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
