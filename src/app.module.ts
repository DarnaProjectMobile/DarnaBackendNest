import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { AnnoncesModule } from './annonces/annonces.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ReportsModule } from './reports/reports.module';
import { PubliciteModule } from './publicite/publicite.module';
import { VisiteModule } from './visite/visite.module';
import { LogementModule } from './logement/logement.module';
import { NotificationModule } from './notification/notification.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { ApireviewsModule } from './apireviews/apireviews.module';
import { QrCodeModule } from './qrcode/qrcode.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    // 👇 Load .env variables globally
    ConfigModule.forRoot({
      isGlobal: true, // makes env vars available everywhere
    }),

    // 👇 Use MONGO_URI from .env or fallback
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/DarnaDB',
    ),

    UsersModule,
    AuthModule,
    MailModule,
    AnnoncesModule,
    ReviewsModule,
    ReportsModule,
    PubliciteModule,
    VisiteModule,
    LogementModule,
    NotificationModule,
    EvaluationModule,
    ApireviewsModule,
    QrCodeModule,
    PaymentsModule,
  ],
})
export class AppModule {}
