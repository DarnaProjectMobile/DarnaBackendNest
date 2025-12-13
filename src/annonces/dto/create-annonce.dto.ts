import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  IsArray,
  ArrayMinSize,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export class CreateAnnonceDto {
  @ApiProperty({ description: "Title of the annonce", example: "Villa S+3" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: "Description of the property", example: "A beautiful villa located in Ariana." })
  @IsString()
  @IsNotEmpty()
  description: string;

  // Images field is handled separately via file upload, not validated here
  images?: string[];

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
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  @IsNumber()
  price: number;

  @ApiProperty({ description: "Maximum number of collocators", example: 4 })
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  @IsNumber()
  nbrCollocateurMax: number;

  @ApiProperty({ description: "Current number of collocators", example: 1 })
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  @IsNumber()
  nbrCollocateurActuel: number;

  @ApiProperty({ description: "Start date", example: "2024-07-01T00:00:00.000Z" })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Handle both formats: "2024-07-01T00:00:00Z" and "2024-07-01T00:00:00.000Z"
      const dateStr = value.endsWith('Z') || value.includes('+') ? value : value + 'Z';
      return dateStr;
    }
    return value;
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: "End date", example: "2024-12-31T00:00:00.000Z" })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Handle both formats: "2024-12-31T00:00:00Z" and "2024-12-31T00:00:00.000Z"
      const dateStr = value.endsWith('Z') || value.includes('+') ? value : value + 'Z';
      return dateStr;
    }
    return value;
  })
  @IsDateString()
  endDate: string;
}
