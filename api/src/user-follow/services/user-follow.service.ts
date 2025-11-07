import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/users.entity';

@Injectable()
export class UserFollowService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async followUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException("No puedes seguirte a ti mismo");
    }

    const currentUser = await this.usersRepository.findOne({
      where: { id: currentUserId },
      relations: ['following'],
    });
    const targetUser = await this.usersRepository.findOne({ where: { id: targetUserId } });

    if (!currentUser || !targetUser) {
      throw new NotFoundException("Usuario no encontrado");
    }

    const alreadyFollowing = currentUser.following.some(u => u.id === targetUserId);
    if (alreadyFollowing) {
      throw new BadRequestException("Ya sigues a este usuario");
    }

    currentUser.following.push(targetUser);
    await this.usersRepository.save(currentUser);

    return { message: `Ahora sigues a ${targetUser.username}` };
  }

  async unfollowUser(currentUserId: string, targetUserId: string) {
    const currentUser = await this.usersRepository.findOne({
      where: { id: currentUserId },
      relations: ['following'],
    });

    if (!currentUser) throw new NotFoundException("Usuario no encontrado");

    currentUser.following = currentUser.following.filter(u => u.id !== targetUserId);
    await this.usersRepository.save(currentUser);

    return { message: `Has dejado de seguir a este usuario` };
  }

  async getFollowers(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['followers'],
    });
    if (!user) throw new NotFoundException("Usuario no encontrado");
    return user.followers;
  }

  async getFollowing(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });
    if (!user) throw new NotFoundException("Usuario no encontrado");
    return user.following;
  }
}
