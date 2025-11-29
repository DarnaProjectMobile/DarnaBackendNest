import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsFirebaseService } from './notifications-firebase.service';

@Injectable()
export class NotificationsFirebaseScheduler {
  constructor(
    private readonly notificationsService: NotificationsFirebaseService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleScheduledReminders(): Promise<void> {
    try {
      await this.notificationsService.processScheduledReminders();
    } catch (error) {
      // Les erreurs sont déjà gérées dans le service, mais on évite que le scheduler plante
      console.error('[NotificationsFirebaseScheduler] Erreur dans le traitement des rappels planifiés:', error);
    }
  }
}




