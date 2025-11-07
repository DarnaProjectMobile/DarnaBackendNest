import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsString, IsUrl, IsDateString } from "class-validator";

export class CreateAnnonceDto {
  @ApiProperty({ example: 'Villa S+3' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'A beautiful villa located in Ariana.' })
  @IsString()
  @IsNotEmpty()
  description: string; // ✅ fixed typo: "discription" → "description"

  @ApiProperty({ example: 'http://example.com/image.jpg' })
  @IsUrl()
  @IsNotEmpty()
  image: string;

  @ApiProperty({
    example: 'S+3',
    enum: ['S', 'S+1', 'S+2', 'S+3', 'S+4', 'Chambre'],
  })
  @IsEnum(['S', 'S+1', 'S+2', 'S+3', 'S+4', 'Chambre'])
  type: string;

  @ApiProperty({ example: 'Ariana, Tunis' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: '2024-07-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ example: '2024-12-31T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endDate: Date;
}
