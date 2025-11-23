import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateAnnonceDto {
  @ApiProperty({ description: 'Nom de l\'annonce (utilisé comme ID du logement)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Titre de l\'annonce' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description de l\'annonce', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Adresse de l\'annonce' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Prix de l\'annonce' })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ description: 'Images de l\'annonce', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Annonce active ou non', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

