import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'property_id_here', description: 'Property ID being reviewed' })
  @IsString()
  @IsNotEmpty()
  property: string;

  @ApiProperty({ example: 5, description: 'Rating between 1 and 5' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Very nice experience!', description: 'Review text' })
  @IsString()
  @IsNotEmpty()
  comment: string;
}