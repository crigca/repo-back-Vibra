import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO para búsqueda de canciones en YouTube
 */
export class SearchSongsDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1, { message: 'maxResults debe ser al menos 1' })
  @Max(50, { message: 'maxResults no puede ser mayor a 50' })
  maxResults?: number = 10;

  @IsOptional()
  @IsString()
  regionCode?: string = 'AR';
}
