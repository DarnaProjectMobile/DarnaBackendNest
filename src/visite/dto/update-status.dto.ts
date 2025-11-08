import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum VisiteStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class UpdateStatusDto {
  @ApiProperty({ 
    description: 'Statut de la visite',
    enum: VisiteStatus,
    example: VisiteStatus.CONFIRMED
  })
  @IsEnum(VisiteStatus)
  @IsNotEmpty()
  status: VisiteStatus;
}

