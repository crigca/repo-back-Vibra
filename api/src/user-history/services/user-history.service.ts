import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserHistoryDto } from '../dto/create-user-history.dto';
import { UpdateUserHistoryDto } from '../dto/update-user-history.dto';
import { UserHistory } from '../entities/user-history.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Song } from 'src/music/entities/song.entity';
import { User } from 'src/users/entities/users.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

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
      // Validar si songId es un UUID válido (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (uuidRegex.test(songId)) {
        // Es un UUID válido, buscar por id
        song = await this.songRepository.findOne({ where: { id: songId } }) || undefined;
      } else {
        // No es UUID, asumir que es youtubeId
        song = await this.songRepository.findOne({ where: { youtubeId: songId } }) || undefined;
      }
    }

    // Si no encontró por songId, intentar con youtubeId del DTO
    if (!song && youtubeId) {
      song = await this.songRepository.findOne({ where: { youtubeId } }) || undefined;
    }

    // 3️⃣ Buscar si ya existe una entrada para este usuario y canción o youtubeId
    const whereConditions: any[] = [];

    // Condición 1: Buscar por youtubeId si existe
    if (youtubeId) {
      whereConditions.push({ user: { id: user.id }, youtubeId });
    }

    // Condición 2: Buscar por song.id solo si songId es un UUID válido
    if (songId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(songId)) {
        whereConditions.push({ user: { id: user.id }, song: { id: songId } });
      }
    }

    let userHistory = await this.userHistoryRepository.findOne({
      where: whereConditions.length > 0 ? whereConditions : undefined,
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

  async findOneByUser(userId: string, requesterId?: string) {
  const histories = await this.userHistoryRepository.find({
    where: { user: { id: userId } },
    relations: ['song'],
    order: { playedAt: 'DESC' },
  });

  if (!histories.length) {
    throw new NotFoundException('Este usuario no tiene historial');
  }

  return histories;
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

  // 🗑️ Borrar UNA canción específica del historial de un usuario
  async removeSongFromUser(userId: string, entryId: string) {
    const entry = await this.userHistoryRepository.findOne({
      where: { id: entryId, user: { id: userId } },
    });

    if (!entry) {
      throw new NotFoundException(`Entrada ${entryId} no encontrada para el usuario ${userId}`);
    }

    await this.userHistoryRepository.remove(entry);

    return { message: `Entrada ${entryId} eliminada del historial del usuario ${userId}` };
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
