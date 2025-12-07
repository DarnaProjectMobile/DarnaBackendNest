import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Montant en euros (ex: 10 = 10€)',
    example: 10,
    minimum: 0.5,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0.5)
  amount: number;

  @ApiPropertyOptional({
    description: 'ID de la ressource associée (publicité, commande, etc.)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({
    description: 'Type de ressource (publicite, order, etc.)',
    example: 'publicite',
  })
  @IsOptional()
  @IsString()
  resourceType?: string;
}

