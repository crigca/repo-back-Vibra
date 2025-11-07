import { IsEmail, IsNotEmpty, isString, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  googleId!: string;

  @IsString()
  profileImage?: string;
}
