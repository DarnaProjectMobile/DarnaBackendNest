import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email doit être une adresse email valide' })
  @IsNotEmpty({ message: 'Email est requis' })
  @IsString({ message: 'Email doit être une chaîne de caractères' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty({ message: 'Mot de passe est requis' })
  @IsString({ message: 'Mot de passe doit être une chaîne de caractères' })
  @MinLength(6, { message: 'Mot de passe doit contenir au moins 6 caractères' })
  password: string;
}
