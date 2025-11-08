import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from '../entities/users.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find();
  }

  async findOneWithRelations(targetUserId: string, currentUserId: string) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.followers', 'followers')
      .leftJoinAndSelect('user.following', 'following')
      .where('user.id = :targetUserId', { targetUserId })
      .getOne();

    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Verificar relaciones con currentUser
    const isFollowing = user.followers.some(f => f.id === currentUserId);
    const isFollowedBy = user.following.some(f => f.id === currentUserId);

    const followersCount = user.followers.length;
    const followingCount = user.following.length;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      profileImage: user.profileImage,
      privacy: user.privacy,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      followersCount,
      followingCount,
      isFollowing,
      isFollowedBy,
    };
  }


  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.usersRepository.findOneBy({ id });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      Object.assign(user, updateUserDto);

      const updatedUser = await this.usersRepository.save(user);
      return updatedUser;
    } catch (err) {
      throw new Error(`Error al actualizar usuario: ${err.message}`);
    }
  }

  async remove(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.usersRepository.remove(user);
  }

  /**
   * Comprueba si requesterId puede ver el historial de targetUserId.
   * Devuelve { canViewHistory: boolean }
   */
  async canAccessHistory(targetUserId: string, requesterId?: string) {
    const targetUser = await this.usersRepository.findOne({
      where: { id: targetUserId },
      relations: ['followers', 'following'],
    });

    if (!targetUser) throw new NotFoundException('Usuario no encontrado');

    // ✅ Si es el dueño del perfil
    if (targetUserId === requesterId) {
      return { canViewHistory: true, reason: 'own_profile' };
    }

    switch (targetUser.privacy) {
      case 'public':
        return { canViewHistory: true, reason: 'public' };

      case 'private':
        return { canViewHistory: false, reason: 'private' };

      case 'followers': {
        const isFollower = targetUser.followers.some(f => f.id === requesterId);
        return { canViewHistory: isFollower, reason: isFollower ? 'follower' : 'not_follower' };
      }

      case 'followed': {
        const isFollowed = targetUser.following.some(f => f.id === requesterId);
        return { canViewHistory: isFollowed, reason: isFollowed ? 'followed' : 'not_followed' };
      }

      case 'mutuals': {
        const isFollower = targetUser.followers.some(f => f.id === requesterId);
        const isFollowing = targetUser.following.some(f => f.id === requesterId);
        const isMutual = isFollower && isFollowing;
        return { canViewHistory: isMutual, reason: isMutual ? 'mutual' : 'not_mutual' };
      }

      default:
        return { canViewHistory: false, reason: 'unknown_privacy' };
    }
  }

}
