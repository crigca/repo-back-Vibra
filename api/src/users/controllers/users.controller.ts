import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { UsersService } from './../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // ✅ Nuevo: devolver perfil con estado follow
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.usersService.findOneWithRelations(id, currentUser.userId);
  }



  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    if (currentUser.userId !== id) {
      throw new ForbiddenException('No puedes modificar otros usuarios');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() currentUser: any) {
    if (currentUser.userId !== id) {
      throw new ForbiddenException('No puedes eliminar otros usuarios');
    }
    return this.usersService.remove(id);
  }

  @Get(':id/can-access-history')
  async canAccessHistory(
    @Param('id') targetUserId: string,
    @CurrentUser() currentUser: any,
  ) {
    console.log('🟣 Revisando acceso al historial:', {
      targetUserId,
      requesterId: currentUser?.id,
    });

    return this.usersService.canAccessHistory(targetUserId, currentUser?.userId);
  }

  // ✅ Obtener lista de seguidores
  @Get(':targetUserId/followers')
  async getFollowers(
    @Param('targetUserId') targetUserId: string,
    @Query('currentUserId') currentUserId: string,
  ) {
    return this.usersService.getFollowers(targetUserId, currentUserId);
  }

  // ✅ Obtener lista de seguidos
  @Get(':targetUserId/following')
  async getFollowing(
    @Param('targetUserId') targetUserId: string,
    @Query('currentUserId') currentUserId: string,
  ) {
    return this.usersService.getFollowing(targetUserId, currentUserId);
  }
}
