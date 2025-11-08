import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ description: 'ID de l\'utilisateur destinataire' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Titre de la notification' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Message de la notification' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Type de notification', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Données supplémentaires', required: false })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
