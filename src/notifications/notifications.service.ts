import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { VisiteService } from '../visite/visite.service';
import { VisiteDocument } from '../visite/schemas/visite.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private visiteService: VisiteService,
  ) {}

  async create(notificationData: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    visiteId?: string;
    actionUrl?: string;
  }): Promise<Notification> {
    const notification = new this.notificationModel({
      ...notificationData,
      read: false,
      active: true,
    });
    return notification.save();
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ userId, active: true })
      .sort({ createdAt: -1 })
      .exec();
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

  // Vérifier et créer des alertes pour les visites à venir (3 jours, 1 jour, même jour)
  async checkUpcomingVisites(): Promise<void> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneDayEnd = new Date(oneDayLater.getTime() + 24 * 60 * 60 * 1000 - 1);
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const threeDaysEnd = new Date(threeDaysLater.getTime() + 24 * 60 * 60 * 1000 - 1);

    // Récupérer toutes les visites confirmées
    const allVisites = await this.visiteService.findAll();
    
    for (const visite of allVisites) {
      if (visite.status === 'confirmed' && visite.dateVisite && !visite.validated) {
        const visiteDate = new Date(visite.dateVisite);
        const visiteId = (visite as any).id || (visite as any)._id?.toString() || (visite as any).id;
        
        // Vérifier si la visite est aujourd'hui
        if (visiteDate >= todayStart && visiteDate <= todayEnd) {
          const existing = await this.notificationModel.findOne({
            userId: visite.userId,
            visiteId,
            active: true,
            type: 'error',
            'message': { $regex: /aujourd'hui|même jour/i }
          }).exec();

          if (!existing) {
            await this.create({
              userId: visite.userId,
              title: `⚠️ Visite aujourd'hui !`,
              message: `Vous avez une visite prévue aujourd'hui à ${visiteDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Ne l'oubliez pas !`,
              type: 'error',
              visiteId,
              actionUrl: `/visite/${visiteId}`,
            });
          }
        }
        // Vérifier si la visite est demain (1 jour)
        else if (visiteDate >= oneDayLater && visiteDate <= oneDayEnd) {
          const existing = await this.notificationModel.findOne({
            userId: visite.userId,
            visiteId,
            active: true,
            type: 'warning',
            'message': { $regex: /demain|1 jour/i }
          }).exec();

          if (!existing) {
            await this.create({
              userId: visite.userId,
              title: `Rappel: Visite demain`,
              message: `Vous avez une visite prévue demain le ${visiteDate.toLocaleDateString('fr-FR')} à ${visiteDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Préparez-vous !`,
              type: 'warning',
              visiteId,
              actionUrl: `/visite/${visiteId}`,
            });
          }
        }
        // Vérifier si la visite est dans 3 jours
        else if (visiteDate >= threeDaysLater && visiteDate <= threeDaysEnd) {
          const existing = await this.notificationModel.findOne({
            userId: visite.userId,
            visiteId,
            active: true,
            type: 'info',
            'message': { $regex: /3 jours/i }
          }).exec();

          if (!existing) {
            await this.create({
              userId: visite.userId,
              title: `Rappel: Visite dans 3 jours`,
              message: `Vous avez une visite prévue le ${visiteDate.toLocaleDateString('fr-FR')} à ${visiteDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Pensez à vous préparer !`,
              type: 'info',
              visiteId,
              actionUrl: `/visite/${visiteId}`,
            });
          }
        }
      }
    }
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
          }).exec();

          if (!existing) {
            const visiteId = (visite as VisiteDocument).id || (visite as any)._id?.toString();
            await this.create({
              userId: visite.userId,
              title: `Visite non validée`,
              message: `Votre visite du ${visiteDate.toLocaleDateString('fr-FR')} n'a pas encore été validée. Pensez à valider votre visite !`,
              type: 'error',
              visiteId,
              actionUrl: `/visite/${visiteId}`,
            });
          }
        }
      }
    }
  }
}

