import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  IsArray,
  IsOptional,
} from "class-validator";

export class CreateAnnonceDto {
  @ApiProperty({ description: "Title of the annonce", example: "Villa S+3" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: "Description of the property",
    example: "A beautiful villa located in Ariana."
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: "List of image URLs (populated by server after upload)",
    type: [String],
    example: ["/uploads/annonces/filename1.jpg", "/uploads/annonces/filename2.jpg"]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    description: "Type of property",
    enum: ["S", "S+1", "S+2", "S+3", "S+4", "Chambre"],
    example: "S+3"
  })
  @IsEnum(["S", "S+1", "S+2", "S+3", "S+4", "Chambre"])
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

  @ApiProperty({
    description: "Start date (ISO 8601)",
    example: "2024-07-01T00:00:00.000Z"
  })
  @IsDateString()
  startDate: string;  // ← FIXED (was Date)

  @ApiProperty({
    description: "End date (ISO 8601)",
    example: "2024-12-31T00:00:00.000Z"
  })
  @IsDateString()
  endDate: string;  // ← FIXED (was Date)
}
