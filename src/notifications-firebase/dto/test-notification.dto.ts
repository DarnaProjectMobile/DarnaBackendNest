import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class TestNotificationDto {
  @ApiProperty({
    description: 'Titre de la notification de test',
    example: 'Notification de test',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Corps du message de la notification',
    example: 'Ceci est une notification de test depuis Swagger',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  body: string;
}








