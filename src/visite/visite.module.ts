import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VisiteService } from './visite.service';
import { VisiteController } from './visite.controller';
import { Visite, VisiteSchema } from './schemas/visite.schema';
import { Review, ReviewSchema } from '../reviews/entities/review.entity';
import { ReviewsModule } from '../reviews/reviews.module';
import { UsersModule } from '../users/users.module';
import { LogementModule } from '../logement/logement.module';
import { NotificationsFirebaseModule } from '../notifications-firebase/notifications-firebase.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Visite.name, schema: VisiteSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
    ReviewsModule,
    UsersModule,
    LogementModule,
    NotificationsFirebaseModule,
  ],
  controllers: [VisiteController],
  providers: [VisiteService],
  exports: [VisiteService],
})
export class VisiteModule {}
