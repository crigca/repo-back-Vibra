import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { User } from './entities/users.entity';
import { UserFollowController } from 'src/user-follow/controller/user-follow.controller';
import { UserFollowService } from 'src/user-follow/services/user-follow.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService,UserFollowService],
  controllers: [UsersController,UserFollowController],
  exports: [UsersService], // si otros módulos necesitan el servicio
})
export class UsersModule {}
