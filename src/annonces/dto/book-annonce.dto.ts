import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty } from "class-validator";

export class BookAnnonceDto {
  @ApiProperty({ example: "2025-01-15T00:00:00.000Z" })
  @IsDateString()
  @IsNotEmpty()
  bookingStartDate: Date;
}
