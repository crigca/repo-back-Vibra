import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserHistoryService } from '../services/user-history.service';
import { CreateUserHistoryDto } from '../dto/create-user-history.dto';
import { UpdateUserHistoryDto } from '../dto/update-user-history.dto';

@Controller('user-history')
export class UserHistoryController {
  constructor(private readonly userHistoryService: UserHistoryService) {}

  @Post()
  create(@Body() createUserHistoryDto: CreateUserHistoryDto) {
    return this.userHistoryService.create(createUserHistoryDto);
  }

  @Get()
  findAll() {
    return this.userHistoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userHistoryService.findOne(id);
  }
//historial entero de x user
  @Get('/user/:userId')
  findOneByUser(@Param('userId') id: string) {
    return this.userHistoryService.findOneByUser(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserHistoryDto: UpdateUserHistoryDto) {
    return this.userHistoryService.update(id, updateUserHistoryDto);
  }
//cancion por cancion
  @Delete(':userId/:songId')
  async removeSongFromUser(
    @Param('userId') userId: string,
    @Param('songId') songId: string,
  ) {
    return this.userHistoryService.removeSongFromUser(userId, songId);
  }

  @Delete('user/:id')
  async deleteAll(@Param('id') userId: string) {
    return this.userHistoryService.deleteAllByUser(userId);
  }
}
