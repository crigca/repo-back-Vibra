import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';

/**
 * DTO para crear nueva canción
 */
export class CreateSongDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  artist: string;

  @IsString()
  @IsNotEmpty()
  youtubeId: string;

  @IsNumber()
  @Min(1, { message: 'La duración debe ser mayor a 0 segundos' })
  duration: number;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'viewCount no puede ser negativo' })
  viewCount?: number;

  @IsOptional()
  @IsDateString({}, { message: 'publishedAt debe ser una fecha válida' })
  publishedAt?: string;
}
