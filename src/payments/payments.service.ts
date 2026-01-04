import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import Stripe from 'stripe';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new InternalServerErrorException('STRIPE_SECRET_KEY is not defined in environment variables');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover',
    });
  }

  /**
   * Crée un PaymentIntent Stripe pour un montant donné (en euros)
   */
  async createPaymentIntent(amount: number) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe attend le montant en centimes
        currency: 'eur',
        automatic_payment_methods: { enabled: true },
      });
      return paymentIntent;
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la création du PaymentIntent');
    }
  }

  /**
   * Confirme le paiement et ajoute des crédits à l'utilisateur
   */
  async confirmPaymentAndAddCredits(userId: string, credits = 1) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    const user = await this.userModel.findById(userId);

    if (!user) throw new BadRequestException('Utilisateur non trouvé');

    user.credits += credits;
    await user.save();

    return {
      success: true,
      credits: user.credits,
    };
  }
}

