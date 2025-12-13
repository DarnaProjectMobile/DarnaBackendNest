import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'property_id_here', description: 'Property ID being reviewed', required: false })
  @IsString()
  @IsOptional()
  property?: string;

  @ApiProperty({ example: 5, description: 'Rating between 1 and 5', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ example: 'Very nice experience!', description: 'Review text', required: false })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({ description: 'Visit ID', required: false })
  @IsOptional()
  visiteId?: string;

  @ApiProperty({ description: 'Logement ID', required: false })
  @IsOptional()
  logementId?: string;

  @ApiProperty({ description: 'Collector ID', required: false })
  @IsOptional()
  collectorId?: string;

  @ApiProperty({ description: 'Collector Rating', required: false })
  @IsNumber()
  @IsOptional()
  collectorRating?: number;

  @ApiProperty({ description: 'Cleanliness Rating', required: false })
  @IsNumber()
  @IsOptional()
  cleanlinessRating?: number;

  @ApiProperty({ description: 'Location Rating', required: false })
  @IsNumber()
  @IsOptional()
  locationRating?: number;

  @ApiProperty({ description: 'Conformity Rating', required: false })
  @IsNumber()
  @IsOptional()
  conformityRating?: number;
}