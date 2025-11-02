// DTO corregido
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { User } from 'src/users/entities/users.entity';

export class CreateUserHistoryDto {
  @IsNotEmpty()
  user: User;

  @IsOptional()
  @IsString()
  songId?: string;

  @IsOptional()
  @IsString()
  youtubeId?: string;
}