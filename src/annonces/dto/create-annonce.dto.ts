import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
  IsDateString,
  IsArray,
  ArrayMinSize,
} from "class-validator";

export class CreateAnnonceDto {
  @ApiProperty({ description: "Title of the annonce", example: "Villa S+3" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: "Description of the property", example: "A beautiful villa located in Ariana." })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: "List of image URLs",
    type: [String],
    example: ["http://example.com/img1.jpg", "http://example.com/img2.jpg"]
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUrl({}, { each: true })
  images: string[];

  @ApiProperty({
    description: "Type of property",
    enum: ['S', 'S+1', 'S+2', 'S+3', 'S+4', 'Chambre'],
    example: "S+3"
  })
  @IsEnum(['S', 'S+1', 'S+2', 'S+3', 'S+4', 'Chambre'])
  type: string;

  @ApiProperty({ description: "Location city & area", example: "Ariana, Tunis" })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ description: "Monthly price", example: 1200 })
  @IsNumber()
  price: number;

  @ApiProperty({ description: "Maximum number of collocators", example: 4 })
  @IsNumber()
  nbrCollocateurMax: number;

  @ApiProperty({ description: "Current number of collocators", example: 1 })
  @IsNumber()
  nbrCollocateurActuel: number;

  @ApiProperty({ description: "Start date", example: "2024-07-01T00:00:00.000Z" })
  @IsDateString()
  startDate: Date;

  @ApiProperty({ description: "End date", example: "2024-12-31T00:00:00.000Z" })
  @IsDateString()
  endDate: Date;
}
