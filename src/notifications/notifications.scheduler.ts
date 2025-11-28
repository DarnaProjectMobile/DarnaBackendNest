import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Vérifier les rappels programmés toutes les 5 minutes
  @Cron('*/5 * * * *')
  async handleScheduledReminders() {
    await this.notificationsService.checkScheduledReminders();
  }

  // Vérifier les visites manquées toutes les heures
  @Cron(CronExpression.EVERY_HOUR)
  async handleMissedVisites() {
    await this.notificationsService.checkMissedVisites();
  }
}












