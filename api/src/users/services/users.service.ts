import { Inject, Injectable } from '@nestjs/common';
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

  create(createUserDto: CreateUserDto) {
    return this.usersRepository.create(createUserDto);
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id: string) {
    return this.usersRepository.findOneBy({id});
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try{
      let userPreUpdate = await this.usersRepository.findOneBy({id})
      if (!userPreUpdate) {
        throw new Error('Usuario no encontrado');
      }
      const userToSave = {...userPreUpdate, ...updateUserDto}

      const userUpdated = await this.usersRepository.save(userToSave)
      return userUpdated
    }catch(err){
      throw new Error(`Error al actualizar usuario: ${err.message}`);
    }
  }

  remove(id: string) {
    return this.usersRepository.remove({id} as User);
  }
}
