import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { Role } from 'src/auth/common/role.enum';
import { IsDateStringFlexible } from './validators/date-string.validator';

export enum Gender {
  Male = 'Male',
  Female = 'Female',
}

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({enum: [Role.Client, Role.Collocator, Role.Sponsor]})
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ 
    example: '1990-01-15',
    description: 'Date de naissance au format ISO 8601 (YYYY-MM-DD). Exemple: 1990-01-15',
    format: 'date',
    type: String
  })
  @IsDateStringFlexible()
  @IsNotEmpty({ message: 'dateDeNaissance is required' })
  dateDeNaissance: string;

  @ApiProperty()
  @IsString()
  @Matches(/^[0-9+]{8,15}$/, { message: 'Invalid phone number format' })
  numTel: string;

  @ApiProperty({ enum: Gender, example: Gender.Male })
  @IsEnum(Gender)
  gender: Gender;


  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image?: string;

}
