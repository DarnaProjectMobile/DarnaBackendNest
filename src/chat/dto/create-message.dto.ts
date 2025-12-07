import { IsString, IsNotEmpty, MinLength, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ description: 'ID de la visite associée' })
  @IsString()
  @IsNotEmpty()
  visiteId: string;

  @ApiProperty({ description: 'Contenu du message (optionnel si images)' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: 'URLs des images (optionnel)', type: [String] })
  @IsArray()
  @IsOptional()
  images?: string[];
}

