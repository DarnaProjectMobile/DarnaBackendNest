import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 5, description: 'Rating between 1 and 5' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Very nice experience!', description: 'Review text' })
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiProperty({
    example: '6731a9f89b48f3a2e1a12345',
    description: 'ID of an existing user',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
