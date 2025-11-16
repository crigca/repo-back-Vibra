import { Module } from '@nestjs/common';
import { UserFollowService } from './services/user-follow.service';
import { UserFollowController } from './controller/user-follow.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/users.entity';

@Module({
  controllers: [UserFollowController],
  providers: [UserFollowService],
  imports: [TypeOrmModule.forFeature([User])]
})
export class UserFollowModule {}
