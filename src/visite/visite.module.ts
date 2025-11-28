import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VisiteService } from './visite.service';
import { VisiteController } from './visite.controller';
import { Visite, VisiteSchema } from './schemas/visite.schema';
import { ReviewsModule } from '../reviews/reviews.module';
import { UsersModule } from '../users/users.module';
import { LogementModule } from '../logement/logement.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Visite.name, schema: VisiteSchema }]),
    ReviewsModule,
    UsersModule,
    LogementModule,
    forwardRef(() => NotificationsModule),
  ],
  controllers: [VisiteController],
  providers: [VisiteService],
  exports: [VisiteService],
})
export class VisiteModule {}
