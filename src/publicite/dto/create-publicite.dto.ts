import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, IsNumber } from 'class-validator';

export class CreatePubliciteDto {
  @ApiProperty({ description: 'Titre de la publicité' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description de la publicité', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Image de la publicité' })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty({ description: 'Lien de la publicité', required: false })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiProperty({ description: 'Publicité active ou non', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Date de début de la publicité' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Date de fin de la publicité' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}

