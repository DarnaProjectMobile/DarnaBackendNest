import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEnum } from 'class-validator';

export enum VisiteStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class CreateVisiteDto {
  @ApiProperty({ description: 'ID du logement' })
  @IsString()
  @IsNotEmpty()
  logementId: string;

  // userId n'est plus requis - il sera automatiquement pris de l'utilisateur connecté

  @ApiProperty({ description: 'Date et heure de la visite (ISO string)' })
  @IsDateString()
  @IsNotEmpty()
  dateVisite: string;

  @ApiProperty({ description: 'Notes optionnelles', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Téléphone de contact', required: false })
  @IsOptional()
  @IsString()
  contactPhone?: string;
}
