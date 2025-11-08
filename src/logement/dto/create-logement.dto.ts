import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  Min,
} from 'class-validator';

export class LocationDto {
  @ApiProperty()
  @IsNumber()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  longitude: number;
}

export class CreateLogementDto {
  @ApiProperty({ description: 'ID du propriétaire' })
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @ApiProperty({ description: 'Titre du logement' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description du logement' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Adresse' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Ville' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'Prix' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Surface en m²' })
  @IsNumber()
  @Min(0)
  surface: number;

  @ApiProperty({ description: 'Nombre de pièces' })
  @IsNumber()
  @Min(1)
  rooms: number;

  @ApiProperty({ description: 'Tableau d\'URLs d\'images', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Type de logement', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Coordonnées GPS', required: false })
  @IsOptional()
  @IsObject()
  location?: LocationDto;

  @ApiProperty({ description: 'Équipements', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}
