import { Module } from '@nestjs/common';
import { AdminModule as AdminJsModule } from '@adminjs/nestjs';
import AdminJS from 'adminjs';
import * as AdminJSMongoose from '@adminjs/mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Annonce, AnnonceSchema } from '../annonces/entities/annonce.entity';
import { Logement, LogementSchema } from '../logement/schemas/logement.schema';
import { Review, ReviewSchema } from '../reviews/entities/review.entity';
import { Payments, PaymentsSchema } from '../payments/schema/payments.schema';

AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

@Module({
  imports: [
    AdminJsModule.createAdminAsync({
      inject: [
        getModelToken(User.name),
        getModelToken(Annonce.name),
        getModelToken(Logement.name),
        getModelToken(Review.name),
        getModelToken(Payments.name),
      ],
      useFactory: (
        UserModel,
        AnnonceModel,
        LogementModel,
        ReviewModel,
        PaymentModel,
      ) => ({
        adminJsOptions: {
          rootPath: '/admin',
          resources: [
            { resource: UserModel },
            { resource: AnnonceModel },
            { resource: LogementModel },
            { resource: ReviewModel },
            { resource: PaymentModel },
          ],
          branding: {
            companyName: 'Darna Dashboard',
            logo: false,
            softwareBrothers: false,
          },
        },

        auth: {
          authenticate: async (email, password) => {
            // 🔐 hard-coded admin login
            if (
              email === process.env.ADMIN_EMAIL &&
              password === process.env.ADMIN_PASSWORD
            ) {
              return { email };
            }
            return null;
          },
          cookieName: 'adminjs',
          cookiePassword: process.env.ADMIN_COOKIE_SECRET || 'supersecret',
        },

        sessionOptions: {
          resave: false,
          saveUninitialized: false,
          secret: process.env.ADMIN_COOKIE_SECRET || 'supersecret',
        },
      }),
    }),
  ],
})
export class AdminModule {}