import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID de la visite' })
  @IsString()
  @IsNotEmpty()
  visiteId: string;

  @ApiProperty({
    description: 'Note globale de 1 à 5 (si omise, calculée comme moyenne des sous-notes)',
    minimum: 1,
    maximum: 5,
    required: false,
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ description: 'Note du collector (1 à 5)', minimum: 1, maximum: 5, example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  collectorRating: number;

  @ApiProperty({ description: 'Propreté du logement (1 à 5)', minimum: 1, maximum: 5, example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  cleanlinessRating: number;

  @ApiProperty({ description: 'Localisation du logement (1 à 5)', minimum: 1, maximum: 5, example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  locationRating: number;

  @ApiProperty({ description: 'Conformité du logement à l’annonce (1 à 5)', minimum: 1, maximum: 5, example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  conformityRating: number;

  @ApiProperty({ description: 'Commentaire optionnel', required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: 'ID du logement concerné (renseigné automatiquement côté serveur pour /visite/:id/review)',
    required: false,
  })
  @IsOptional()
  @IsString()
  logementId?: string;

  @ApiProperty({
    description: 'ID du collector / propriétaire du logement (renseigné automatiquement côté serveur)',
    required: false,
  })
  @IsOptional()
  @IsString()
  collectorId?: string;
}
