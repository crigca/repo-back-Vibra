import {
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SongPositionDto {
  @IsUUID(4, { message: 'songId debe ser un UUID válido' })
  songId: string;

  @IsNumber({}, { message: 'position debe ser un número' })
  @Min(1, { message: 'position debe ser mayor a 0' })
  position: number;
}

export class ReorderSongsDto {
  @IsArray({ message: 'songs debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos una canción para reordenar' })
  @ValidateNested({ each: true })
  @Type(() => SongPositionDto)
  songs: SongPositionDto[];
}