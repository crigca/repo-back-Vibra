import { IsArray, ArrayMaxSize, IsUUID } from 'class-validator';

export class ReplaceSongsDto {
  @IsArray({ message: 'songIds debe ser un array' })
  @ArrayMaxSize(30, { message: 'No puede tener más de 30 canciones en una playlist' })
  @IsUUID(4, { each: true, message: 'Cada songId debe ser un UUID válido' })
  songIds: string[];
}
