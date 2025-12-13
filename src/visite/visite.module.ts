import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VisiteService } from './visite.service';
import { VisiteController } from './visite.controller';
import { Visite, VisiteSchema } from './schemas/visite.schema';
import { ReviewsModule } from '../reviews/reviews.module';
import { UsersModule } from '../users/users.module';
import { LogementModule } from '../logement/logement.module';
import { NotificationsFirebaseModule } from '../notifications-firebase/notifications-firebase.module';
import { AnnoncesModule } from '../annonces/annonces.module';
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Visite.name, schema: VisiteSchema }]),
    ReviewsModule,
    UsersModule,
    LogementModule,
    NotificationsFirebaseModule,
    AnnoncesModule,
    AvailabilityModule,
  ],
  controllers: [VisiteController],
  providers: [VisiteService],
  exports: [VisiteService],
})
export class VisiteModule { }
