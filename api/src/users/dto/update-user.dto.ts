import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsIn(['public', 'private', 'followers', 'followed', 'mutuals'])
  privacy?: 'public' | 'private' | 'followers' | 'followed' | 'mutuals';
}
