import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UploadDocumentsDto {
  @ApiProperty({ description: 'Liste des noms de fichiers uploadés', type: [String] })
  @IsArray()
  @IsString({ each: true })
  documents: string[];
}













