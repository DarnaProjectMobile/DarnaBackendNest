import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsBoolean } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID de la visite' })
  @IsString()
  @IsNotEmpty()
  visiteId: string;

  @ApiProperty({ description: 'Note de 1 à 5', minimum: 1, maximum: 5, example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Commentaire optionnel', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}
