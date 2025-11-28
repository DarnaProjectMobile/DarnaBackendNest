import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { VisiteService } from '../visite/visite.service';
import { VisiteDocument } from '../visite/schemas/visite.schema';
import { LogementService } from '../logement/logement.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @Inject(forwardRef(() => VisiteService))
    private visiteService: VisiteService,
    private logementService: LogementService,
    private usersService: UsersService,
  ) {}

  async create(notificationData: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    visiteId?: string;
    logementId?: string;
    logementTitle?: string;
    actionUrl?: string;
    scheduledFor?: Date;
  }): Promise<NotificationDocument> {
    const notification = new this.notificationModel({
      ...notificationData,
      read: false,
      active: true,
    });
    return notification.save();
  }

  async findByUserId(userId: string): Promise<NotificationDocument[]> {
    console.log(`[NotificationsService] Récupération des notifications pour userId: ${userId}`);
    const notifications = await this.notificationModel
      .find({ userId, active: true })
      .sort({ createdAt: -1 })
      .exec();
    console.log(`[NotificationsService] ${notifications.length} notification(s) trouvée(s) pour userId: ${userId}`);
    notifications.forEach((notif, index) => {
      const notifId = notif._id?.toString() || 'unknown';
      console.log(`[NotificationsService] Notification ${index + 1}: id=${notifId}, type=${notif.type}, title=${notif.title}, read=${notif.read}`);
    });
    return notifications;
  }

  async findById(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findById(notificationId).exec();
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found`);
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.active) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({ userId, read: false, active: true })
      .exec();
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findById(notificationId).exec();
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found`);
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    notification.read = true;
    return notification.save();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel
      .updateMany({ userId, read: false }, { read: true })
      .exec();
  }

  async hideNotification(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findById(notificationId).exec();
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found`);
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    notification.active = false;
    return notification.save();
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationModel.findById(notificationId).exec();
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found`);
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationModel.findByIdAndDelete(notificationId).exec();
  }

  // Créer une notification pour l'acceptation d'une visite (côté client)
  async notifyVisiteAccepted(visite: any): Promise<void> {
    const visiteId = visite.id || visite._id?.toString();
    const logementTitle = visite.logementTitle || 'le logement';
    
    await this.create({
      userId: visite.userId,
      title: '✅ Visite acceptée',
      message: `Votre visite pour ${logementTitle} a été acceptée.`,
      type: 'success',
      visiteId,
      logementId: visite.logementId,
      logementTitle,
    });

    // Planifier les rappels automatiques
    await this.scheduleVisiteReminders(visite);
  }

  // Créer une notification pour le refus d'une visite (côté client)
  async notifyVisiteRejected(visite: any): Promise<void> {
    const visiteId = visite.id || visite._id?.toString();
    const logementTitle = visite.logementTitle || 'le logement';
    
    console.log(`[NotificationsService] Création notification de refus - visiteId: ${visiteId}, userId: ${visite.userId}, logementTitle: ${logementTitle}`);
    
    try {
      const notification = await this.create({
        userId: visite.userId,
        title: '❌ Visite refusée',
        message: `Votre visite pour ${logementTitle} a été refusée.`,
        type: 'visite_rejected',
        visiteId,
        logementId: visite.logementId,
        logementTitle,
      });
      const notificationId = notification._id?.toString() || 'unknown';
      console.log(`[NotificationsService] Notification de refus créée avec succès pour userId: ${visite.userId}, notificationId: ${notificationId}`);
    } catch (error) {
      console.error(`[NotificationsService] Erreur lors de la création de la notification de refus pour userId: ${visite.userId}:`, error);
    }
  }

  // Créer une notification pour l'annulation d'une visite par le client (côté colocator)
  async notifyVisiteCancelledByClient(visite: any): Promise<void> {
    const visiteId = visite.id || visite._id?.toString();
    const logementTitle = visite.logementTitle || 'votre logement';
    const clientName = visite.clientUsername || visite.clientName || 'Un client';
    
    console.log(`[NotificationsService] Création notification d'annulation - visiteId: ${visiteId}, logementId: ${visite.logementId}, clientName: ${clientName}`);
    
    // Récupérer le propriétaire du logement
    let ownerId: string | null = null;
    try {
      if (visite.logementId) {
        try {
          const logement = await this.logementService.findOne(visite.logementId);
          ownerId = logement?.ownerId;
          console.log(`[NotificationsService] OwnerId trouvé via findOne: ${ownerId}`);
        } catch (e) {
          // Si le logement n'existe pas, essayer avec findByAnnonceId
          try {
            const logement = await this.logementService.findByAnnonceId(visite.logementId);
            ownerId = logement?.ownerId;
            console.log(`[NotificationsService] OwnerId trouvé via findByAnnonceId: ${ownerId}`);
          } catch (e2) {
            console.warn(`[NotificationsService] Impossible de trouver le propriétaire du logement ${visite.logementId} pour la notification d'annulation:`, e2.message);
          }
        }
      } else {
        console.warn('[NotificationsService] logementId est null ou undefined dans la visite');
      }
    } catch (e) {
      console.error('[NotificationsService] Erreur lors de la récupération du propriétaire:', e);
    }

    if (ownerId) {
      try {
        const notification = await this.create({
          userId: ownerId,
          title: '🚫 Visite annulée',
          message: `${clientName} a annulé la visite pour ${logementTitle}`,
          type: 'visite_cancelled',
          visiteId,
          logementId: visite.logementId,
          logementTitle,
        });
        const notificationId = notification._id?.toString() || 'unknown';
        console.log(`[NotificationsService] Notification d'annulation créée avec succès pour ownerId: ${ownerId}, notificationId: ${notificationId}`);
      } catch (error) {
        console.error(`[NotificationsService] Erreur lors de la création de la notification d'annulation pour ownerId: ${ownerId}:`, error);
      }
    } else {
      console.error(`[NotificationsService] ERREUR: Impossible de créer la notification d'annulation car ownerId est null pour logementId: ${visite.logementId}`);
    }
  }

  // Créer une notification pour une nouvelle visite réservée (côté colocator)
  async notifyNewVisiteReserved(visite: any): Promise<void> {
    const visiteId = visite.id || visite._id?.toString();
    const logementTitle = visite.logementTitle || 'votre logement';
    const clientName = visite.clientUsername || 'Un client';
    const dateVisite = new Date(visite.dateVisite);
    
    // Récupérer le propriétaire du logement
    let ownerId: string | null = null;
    try {
      if (visite.logementId) {
        const logement = await this.logementService.findOne(visite.logementId);
        ownerId = logement.ownerId;
      }
    } catch (e) {
      // Si le logement n'existe pas, essayer avec findByAnnonceId
      try {
        const logement = await this.logementService.findByAnnonceId(visite.logementId);
        ownerId = logement.ownerId;
      } catch (e2) {
        console.warn('Impossible de trouver le propriétaire du logement');
      }
    }

    if (ownerId) {
      await this.create({
        userId: ownerId,
        title: '🔔 Nouvelle visite réservée',
        message: `Nouvelle visite réservée par ${clientName} le ${dateVisite.toLocaleDateString('fr-FR')} à ${dateVisite.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        type: 'info',
        visiteId,
        logementId: visite.logementId,
        logementTitle,
      });

      // Planifier les rappels pour le colocator aussi
      const visiteWithOwner = { ...visite, userId: ownerId };
      await this.scheduleVisiteReminders(visiteWithOwner);
    }
  }

  // Planifier les rappels automatiques pour une visite
  async scheduleVisiteReminders(visite: any): Promise<void> {
    if (!visite.dateVisite || visite.status !== 'confirmed') {
      return;
    }

    const visiteId = visite.id || visite._id?.toString();
    const visiteDate = new Date(visite.dateVisite);
    const logementTitle = visite.logementTitle || 'le logement';
    const now = new Date();

    // Ne planifier que si la visite est dans le futur
    if (visiteDate <= now) {
      return;
    }

    // Rappel 2 jours avant
    const twoDaysBefore = new Date(visiteDate.getTime() - 2 * 24 * 60 * 60 * 1000);
    if (twoDaysBefore > now) {
      const existing = await this.notificationModel.findOne({
        userId: visite.userId,
        visiteId,
        scheduledFor: twoDaysBefore,
        active: true,
      }).exec();

      if (!existing) {
        await this.create({
          userId: visite.userId,
          title: '📅 Rappel de visite',
          message: `Vous avez une visite prévue pour ${logementTitle} dans 2 jours (${visiteDate.toLocaleDateString('fr-FR')} à ${visiteDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})`,
          type: 'info',
          visiteId,
          logementId: visite.logementId,
          logementTitle,
          scheduledFor: twoDaysBefore,
        });
      }
    }

    // Rappel 1 jour avant
    const oneDayBefore = new Date(visiteDate.getTime() - 24 * 60 * 60 * 1000);
    if (oneDayBefore > now) {
      const existing = await this.notificationModel.findOne({
        userId: visite.userId,
        visiteId,
        scheduledFor: oneDayBefore,
        active: true,
      }).exec();

      if (!existing) {
        await this.create({
          userId: visite.userId,
          title: '⏰ Rappel de visite',
          message: `Vous avez une visite prévue pour ${logementTitle} demain (${visiteDate.toLocaleDateString('fr-FR')} à ${visiteDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})`,
          type: 'warning',
          visiteId,
          logementId: visite.logementId,
          logementTitle,
          scheduledFor: oneDayBefore,
        });
      }
    }

    // Rappel 2h avant (le jour même)
    const twoHoursBefore = new Date(visiteDate.getTime() - 2 * 60 * 60 * 1000);
    const visiteDateOnly = new Date(visiteDate.getFullYear(), visiteDate.getMonth(), visiteDate.getDate());
    const twoHoursBeforeDateOnly = new Date(twoHoursBefore.getFullYear(), twoHoursBefore.getMonth(), twoHoursBefore.getDate());
    if (twoHoursBefore > now && visiteDateOnly.getTime() === twoHoursBeforeDateOnly.getTime()) {
      const existing = await this.notificationModel.findOne({
        userId: visite.userId,
        visiteId,
        scheduledFor: twoHoursBefore,
        active: true,
      }).exec();

      if (!existing) {
        await this.create({
          userId: visite.userId,
          title: '🔔 Visite dans 2h',
          message: `Votre visite pour ${logementTitle} est prévue dans 2 heures (${visiteDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})`,
          type: 'warning',
          visiteId,
          logementId: visite.logementId,
          logementTitle,
          scheduledFor: twoHoursBefore,
        });
      }
    }

    // Rappel 1h avant (le jour même)
    const oneHourBefore = new Date(visiteDate.getTime() - 60 * 60 * 1000);
    const oneHourBeforeDateOnly = new Date(oneHourBefore.getFullYear(), oneHourBefore.getMonth(), oneHourBefore.getDate());
    if (oneHourBefore > now && visiteDateOnly.getTime() === oneHourBeforeDateOnly.getTime()) {
      const existing = await this.notificationModel.findOne({
        userId: visite.userId,
        visiteId,
        scheduledFor: oneHourBefore,
        active: true,
      }).exec();

      if (!existing) {
        await this.create({
          userId: visite.userId,
          title: '⏱️ Visite dans 1h',
          message: `Votre visite pour ${logementTitle} est prévue dans 1 heure (${visiteDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})`,
          type: 'error',
          visiteId,
          logementId: visite.logementId,
          logementTitle,
          scheduledFor: oneHourBefore,
        });
      }
    }
  }

  // Vérifier et créer des notifications pour les rappels programmés (cron job)
  async checkScheduledReminders(): Promise<void> {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Trouver les notifications programmées qui doivent être activées maintenant
    const scheduledNotifications = await this.notificationModel.find({
      scheduledFor: { $lte: fiveMinutesFromNow, $gte: now },
      active: true,
      read: false,
    }).exec();

    // Les notifications sont déjà créées, on les active simplement
    // Cette méthode peut être utilisée pour envoyer des push notifications si nécessaire
  }

  // Vérifier les visites oubliées (date passée mais non validée)
  async checkMissedVisites(): Promise<void> {
    const now = new Date();
    const allVisites = await this.visiteService.findAll();
    
    for (const visite of allVisites) {
      if (visite.status === 'confirmed' && visite.dateVisite && !visite.validated) {
        const visiteDate = new Date(visite.dateVisite);
        
        // Si la date est passée de plus d'un jour
        if (visiteDate < now) {
          const daysPassed = Math.ceil((now.getTime() - visiteDate.getTime()) / (24 * 60 * 60 * 1000));
          
          // Vérifier si une notification existe déjà
          const visiteId = (visite as VisiteDocument).id || (visite as any)._id?.toString();
          const existing = await this.notificationModel.findOne({
            userId: visite.userId,
            visiteId,
            active: true,
            type: 'error',
            'message': { $regex: /non validée/i }
          }).exec();

          if (!existing) {
            const logementTitle = visite.logementTitle || 'le logement';
            await this.create({
              userId: visite.userId,
              title: `Visite non validée`,
              message: `Votre visite pour ${logementTitle} du ${visiteDate.toLocaleDateString('fr-FR')} n'a pas encore été validée. Pensez à valider votre visite !`,
              type: 'error',
              visiteId,
              logementId: visite.logementId,
              logementTitle,
              actionUrl: `/visite/${visiteId}`,
            });
          }
        }
      }
    }
  }
}

