import {
  IsUUID,
  IsOptional,
  IsNumber,
  IsString,
  Min,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';

export class AddSongToPlaylistDto {
  @ValidateIf(o => !o.youtubeId)
  @IsNotEmpty({ message: 'songId es requerido si no se proporciona youtubeId' })
  @IsUUID(4, { message: 'songId debe ser un UUID válido' })
  songId?: string;

  @ValidateIf(o => !o.songId)
  @IsNotEmpty({ message: 'youtubeId es requerido si no se proporciona songId' })
  @IsString({ message: 'youtubeId debe ser un string' })
  youtubeId?: string;

  @IsOptional()
  @IsString({ message: 'title debe ser un string' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'artist debe ser un string' })
  artist?: string;

  @IsOptional()
  @IsNumber({}, { message: 'duration debe ser un número' })
  @Min(1, { message: 'duration debe ser mayor a 0' })
  duration?: number;

  @IsOptional()
  @IsString({ message: 'genre debe ser un string' })
  genre?: string;

  @IsOptional()
  @IsNumber({}, { message: 'position debe ser un número' })
  @Min(1, { message: 'position debe ser mayor a 0' })
  position?: number;
}