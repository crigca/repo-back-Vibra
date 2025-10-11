import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePlaylistDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'El nombre no puede estar vacío' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'La descripción no puede exceder 1000 caracteres' })
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'La URL de imagen no puede exceder 1000 caracteres' })
  coverImageUrl?: string;
}