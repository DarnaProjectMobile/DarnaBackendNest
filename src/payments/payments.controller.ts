import { Controller, Post, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import type { Request } from 'express';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a payment intent' })
  @UseGuards(JwtAuthGuard)
  async createIntent(@Body() dto: CreatePaymentIntentDto) {
    const intent = await this.paymentsService.createPaymentIntent(dto.amount);
    return { clientSecret: intent.client_secret };
  }

  @Post('confirm/:userId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Confirm payment and add credits to user' })
  @UseGuards(JwtAuthGuard)
  async confirm(@Param('userId') userId: string, @Req() req: Request) {
    // Vérifier que l'utilisateur authentifié correspond au userId
    const authenticatedUserId = (req.user as any)?.userId;
    if (authenticatedUserId !== userId) {
      throw new BadRequestException('Vous ne pouvez confirmer que vos propres paiements');
    }
    return this.paymentsService.confirmPaymentAndAddCredits(userId, 1);
  }
}
