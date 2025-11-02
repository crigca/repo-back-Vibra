import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserHistoryDto } from '../dto/create-user-history.dto';
import { UpdateUserHistoryDto } from '../dto/update-user-history.dto';
import { UserHistory } from '../entities/user-history.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Song } from 'src/music/entities/song.entity';
import { User } from 'src/users/entities/users.entity';

@Injectable()
export class UserHistoryService {
  constructor(
    @InjectRepository(UserHistory)
    private userHistoryRepository: Repository<UserHistory>,

    @InjectRepository(Song)  // Inyectar repo Song
    private songRepository: Repository<Song>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserHistoryDto: CreateUserHistoryDto): Promise<UserHistory> {
    const { user, songId, youtubeId } = createUserHistoryDto;

    // 1️⃣ Cargar la entidad completa del usuario (importante para evitar el bug del cascade)
    const userEntity = await this.usersRepository.findOne({ where: { id: user.id } });
    if (!userEntity) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // 2️⃣ Si hay canción, cargarla (opcional)
    let song: Song | undefined;
    if (songId) {
      song = await this.songRepository.findOne({ where: { id: songId } }) || undefined;
    }

    // 3️⃣ Buscar si ya existe una entrada para este usuario y canción o youtubeId
    let userHistory = await this.userHistoryRepository.findOne({
      where: [
        { user: { id: user.id }, youtubeId },
        { user: { id: user.id }, song: { id: songId } },
      ],
      relations: ['user', 'song'],
    });

    // 4️⃣ Si existe, actualizar el playedAt
    if (userHistory) {
      userHistory.playedAt = new Date();
      return await this.userHistoryRepository.save(userHistory);
    }

    // 5️⃣ Si no existe, crear nueva entrada
    const newEntry = this.userHistoryRepository.create({
      user: userEntity,
      song,
      youtubeId,
      playedAt: new Date(),
    });

    return await this.userHistoryRepository.save(newEntry);
  }


  findAll() {
    return this.userHistoryRepository.find();
  }

  findOne(id: string) {
    return this.userHistoryRepository.findBy({id});
  }

  findOneByUser(userId: string) {
    return this.userHistoryRepository.find({where:{user:{id:userId}},relations: ['song'],order:{playedAt:"DESC"},take:10});
  }

  async update(id: string, updateUserHistoryDto: UpdateUserHistoryDto) {
      try{
        let historyPreUpdate = await this.userHistoryRepository.findOneBy({id})
        if (!historyPreUpdate) {
          throw new Error('Usuario no encontrado');
        }
        const userToSave = {...historyPreUpdate, ...updateUserHistoryDto}
  
        const historyUpdated = await this.userHistoryRepository.save(userToSave)
        return historyUpdated
      }catch(err){
        throw new Error(`Error al actualizar usuario: ${err.message}`);
      }
    }

  remove(id: string) {
    return this.userHistoryRepository.delete(id);
  }

  async deleteAllByUser(userId: string): Promise<{ deleted: number }> {
    // 1️⃣ Verificar que el usuario exista (opcional pero recomendado)
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 2️⃣ Borrar todos los registros asociados a ese usuario
    const result = await this.userHistoryRepository.delete({ user: { id: userId } });

    // 3️⃣ Devolver cuántos registros se eliminaron
    return { deleted: result.affected ?? 0 };
  }

}
