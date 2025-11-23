import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  longitude: number;
}

export class CreateLogementDto {
  @ApiProperty({ description: 'ID de l\'annonce (nom de l\'annonce = id du logement)' })
  @IsString()
  @IsNotEmpty()
  annonceId: string;

  @ApiProperty({ description: 'Titre du logement' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description du logement', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Adresse du logement' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Prix du logement' })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ description: 'Images du logement', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Nombre de chambres', required: false })
  @IsOptional()
  @IsNumber()
  rooms?: number;

  @ApiProperty({ description: 'Surface en m²', required: false })
  @IsOptional()
  @IsNumber()
  surface?: number;

  @ApiProperty({ description: 'Disponibilité du logement', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ApiProperty({ description: 'Coordonnées GPS', required: false, type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}









