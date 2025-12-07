import { IsEnum, IsOptional, IsString, IsNotEmpty, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PubliciteType } from '../entities/publicite.entity';

class DetailReductionDto {
  @ApiProperty({ description: 'Pourcentage de réduction', example: 20 })
  @IsNotEmpty()
  pourcentage: number;

  @ApiProperty({ description: 'Conditions d\'utilisation', example: 'Valable sur tous les produits' })
  @IsString()
  @IsNotEmpty()
  conditionsUtilisation: string;
}

class DetailPromotionDto {
  @ApiProperty({ description: 'Description de l\'offre', example: '2 Pizzas achetées = 1 offerte' })
  @IsString()
  @IsNotEmpty()
  offre: string;

  @ApiProperty({ description: 'Conditions', example: 'Sur présentation de la carte étudiante' })
  @IsString()
  @IsNotEmpty()
  conditions: string;
}

class DetailJeuDto {
  @ApiProperty({ description: 'Description du jeu' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Liste des gains', type: [String] })
  gains: string[];
}

export class CreatePubliciteDto {
  @ApiProperty({ description: 'Titre de la publicité', example: 'Promotion rentrée universitaire' })
  @IsString()
  @IsNotEmpty()
  titre: string;

  @ApiProperty({ description: 'Description de la publicité', example: 'Réduction de 20% sur les fournitures scolaires' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'URL de l\'image de la publicité', example: 'https://exemple.com/image.jpg' })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty({ description: 'Type de publicité', enum: PubliciteType, example: PubliciteType.REDUCTION })
  @IsEnum(PubliciteType)
  type: PubliciteType;

  @ApiPropertyOptional({ description: 'Catégorie de la publicité', example: 'NOURRITURE' })
  @IsOptional()
  @IsString()
  categorie?: string;

  @ApiPropertyOptional({ description: 'Date d\'expiration (format: dd/MM/yyyy)', example: '31/12/2025' })
  @IsOptional()
  @IsString()
  dateExpiration?: string;

  @ApiPropertyOptional({ description: 'Détails de réduction', type: DetailReductionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DetailReductionDto)
  detailReduction?: DetailReductionDto;

  @ApiPropertyOptional({ description: 'Détails de promotion', type: DetailPromotionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DetailPromotionDto)
  detailPromotion?: DetailPromotionDto;

  @ApiPropertyOptional({ description: 'Détails de jeu', type: DetailJeuDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DetailJeuDto)
  detailJeu?: DetailJeuDto;

  @ApiPropertyOptional({ description: 'Détails supplémentaires de la publicité (déprécié, utiliser detailReduction/detailPromotion)', example: 'Valable sur tout le campus' })
  @IsOptional()
  @IsString()
  details?: string;
}
