import { Module } from '@nestjs/common';
import { UserHistoryService } from './services/user-history.service';
import { UserHistoryController } from './controller/user-history.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserHistory } from './entities/user-history.entity';
import { Song } from 'src/music/entities/song.entity';
import { User } from 'src/users/entities/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserHistory,Song,User])],
  controllers: [UserHistoryController],
  providers: [UserHistoryService],
})
export class UserHistoryModule {}
