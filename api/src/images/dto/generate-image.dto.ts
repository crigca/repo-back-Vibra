import { IsString, IsOptional, IsEnum } from 'class-validator';

export class GenerateImageDto {
  @IsString()
  songId!: string;

  @IsOptional()
  @IsEnum(['base', 'variation', 'mood', 'style'])
  category?: 'base' | 'variation' | 'mood' | 'style';
}
