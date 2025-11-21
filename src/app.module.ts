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


@Module({
  imports: [
    // 👇 Load .env variables globally
    ConfigModule.forRoot({
      isGlobal: true, // makes env vars available everywhere
    }),

MongooseModule.forRoot(
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/DarnaDB',
),

    UsersModule,
    AuthModule,
    MailModule,
    AnnoncesModule,
    ReviewsModule,
    ReportsModule,
    PubliciteModule,
    VisiteModule,
 
  
  ],
})
export class AppModule {}
