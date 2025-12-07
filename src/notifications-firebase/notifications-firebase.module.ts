import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FirebaseModule } from '../firebase/firebase.module';
import { NotificationsFirebaseService } from './notifications-firebase.service';
import { NotificationsFirebaseController } from './notifications-firebase.controller';
import { NotificationsFirebaseScheduler } from './notifications-firebase.scheduler';

@Module({
  imports: [
    FirebaseModule,
    ScheduleModule,
  ],
  providers: [NotificationsFirebaseService, NotificationsFirebaseScheduler],
  controllers: [NotificationsFirebaseController],
  exports: [NotificationsFirebaseService],
})
export class NotificationsFirebaseModule {}











