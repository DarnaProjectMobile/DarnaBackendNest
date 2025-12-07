import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'ID du PaymentIntent Stripe',
    example: 'pi_3SYYDcHzDVVYaCTR0nGcEBdp',
  })
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;

  @ApiProperty({
    description: 'ID du PaymentMethod Stripe',
    example: 'pm_1SYYDcHzDVVYaCTRxxxxxxxxxxxxx',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}

