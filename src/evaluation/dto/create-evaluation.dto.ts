import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateEvaluationDto {
  @ApiProperty({ description: 'ID de l\'utilisateur évalué' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'ID de l\'utilisateur qui évalue' })
  @IsString()
  @IsNotEmpty()
  evaluatorId: string;

  @ApiProperty({ description: 'Note de 1 à 5', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Commentaire optionnel', required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ description: 'ID du logement concerné', required: false })
  @IsOptional()
  @IsString()
  logementId?: string;
}
