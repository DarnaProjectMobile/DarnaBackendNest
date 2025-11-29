import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FIREBASE_ADMIN } from '../firebase/firebase-admin.provider';
import { NotificationType } from './notification-type.enum';
import { FirebaseNotification, ScheduledNotification, UserToken, UserTokensDocument } from './schemas/firebase-notification.schema';
import { FirebaseNotificationResponseDto } from './dto/firebase-notification-response.dto';

@Injectable()
export class NotificationsFirebaseService {
  constructor(
    @Inject(FIREBASE_ADMIN) private readonly firebase: typeof admin,
  ) {}

  private get isConfigured(): boolean {
    try {
      return this.firebase && this.firebase.apps && this.firebase.apps.length > 0;
    } catch (error) {
      return false;
    }
  }

  private get firestore(): FirebaseFirestore.Firestore {
    if (!this.isConfigured) {
      throw new Error('Firebase n\'est pas configuré. Vérifiez que le fichier firebase-service-account.json existe.');
    }
    return this.firebase.firestore();
  }

  private get messaging(): admin.messaging.Messaging {
    if (!this.isConfigured) {
      throw new Error('Firebase n\'est pas configuré. Vérifiez que le fichier firebase-service-account.json existe.');
    }
    return this.firebase.messaging();
  }

  async registerToken(
    userId: string,
    platform: 'ANDROID' | 'IOS' | 'WEB',
    fcmToken: string,
  ): Promise<void> {
    if (!this.isConfigured) {
      // Firebase non configuré : on ne fait rien pour ne pas casser l'appli
      console.warn('[NotificationsFirebaseService] Firebase non configuré, token non enregistré');
      throw new Error('Firebase n\'est pas configuré. Vérifiez que le fichier firebase-service-account.json existe.');
    }
    
    if (!fcmToken || fcmToken.trim().length === 0) {
      throw new Error('Le token FCM ne peut pas être vide');
    }

    // Avertissement si le token ressemble à un JWT (commence par "eyJ")
    if (fcmToken.trim().startsWith('eyJ')) {
      console.warn(`[NotificationsFirebaseService] Le token FCM ressemble à un JWT. Un token FCM Firebase est généralement différent.`);
    }

    try {
      const userTokensRef = this.firestore.collection('userTokens').doc(userId);
      const snap = await userTokensRef.get();
      const now = this.firebase.firestore.FieldValue.serverTimestamp();

      if (!snap.exists) {
        const newToken: UserToken = { token: fcmToken, platform, updatedAt: now };
        const userTokensDoc: UserTokensDocument = {
          userId,
          tokens: [newToken],
        };
        await userTokensRef.set(userTokensDoc);
        console.log(`[NotificationsFirebaseService] Token FCM enregistré pour l'utilisateur ${userId}`);
        return;
      }

      const data = snap.data() as UserTokensDocument | undefined;
      const existingTokens: UserToken[] = data?.tokens ?? [];
      const filtered = existingTokens.filter((t: UserToken) => t.token !== fcmToken);
      const newToken: UserToken = { token: fcmToken, platform, updatedAt: now };
      filtered.push(newToken);

      await userTokensRef.update({ tokens: filtered });
      console.log(`[NotificationsFirebaseService] Token FCM mis à jour pour l'utilisateur ${userId}`);
    } catch (error: any) {
      console.error('[NotificationsFirebaseService] Erreur lors de l\'enregistrement du token FCM:', error);
      // On propage l'erreur avec un message clair
      const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
      if (error?.code === 5 || error?.code === 'NOT_FOUND') {
        throw new Error('Erreur Firestore: Collection non trouvée. Vérifiez la configuration Firebase.');
      }
      throw new Error(`Impossible d'enregistrer le token FCM: ${errorMessage}`);
    }
  }

  private async sendAndStoreNotification(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    visitId?: string;
    housingId?: string;
    role?: 'CLIENT' | 'COLLECTOR';
    sentBy?: 'CLIENT' | 'COLLECTOR';
  }): Promise<void> {
    if (!this.isConfigured) {
      return;
    }
    const {
      userId,
      type,
      title,
      body,
      visitId,
      housingId,
      role = 'CLIENT',
      sentBy = 'COLLECTOR',
    } = params;

    const userTokensRef = this.firestore.collection('userTokens').doc(userId);
    const snap = await userTokensRef.get();
    const userTokensData = snap.exists ? (snap.data() as UserTokensDocument) : null;
    const tokens = userTokensData?.tokens?.map((t: UserToken) => t.token as string) ?? [];

    const notificationData: Omit<FirebaseNotification, 'id'> = {
      userId,
      type,
      title,
      body,
      visitId: visitId ?? null,
      housingId: housingId ?? null,
      role,
      isRead: false,
      createdAt: this.firebase.firestore.FieldValue.serverTimestamp(),
      sentBy,
    };
    const notificationRef = await this.firestore.collection('notifications').add(notificationData);

    if (tokens.length === 0) {
      return;
    }

    await this.messaging.sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
      },
      data: {
        notificationId: notificationRef.id,
        type,
        visitId: visitId ?? '',
        housingId: housingId ?? '',
      },
    });
  }

  async notifyVisitAccepted(params: {
    userId: string;
    visitId: string;
    housingId: string;
    housingTitle?: string;
  }): Promise<void> {
    if (!this.isConfigured) {
      return;
    }
    const title = 'Visite acceptée';
    const body = `Votre visite pour ${params.housingTitle ?? 'le logement'} a été acceptée.`;

    await this.sendAndStoreNotification({
      userId: params.userId,
      type: NotificationType.VISIT_ACCEPTED,
      title,
      body,
      visitId: params.visitId,
      housingId: params.housingId,
    });
  }

  async notifyVisitRefused(params: {
    userId: string;
    visitId: string;
    housingId: string;
    housingTitle?: string;
  }): Promise<void> {
    if (!this.isConfigured) {
      return;
    }
    const title = 'Visite refusée';
    const body = `Votre visite pour ${params.housingTitle ?? 'le logement'} a été refusée.`;

    await this.sendAndStoreNotification({
      userId: params.userId,
      type: NotificationType.VISIT_REFUSED,
      title,
      body,
      visitId: params.visitId,
      housingId: params.housingId,
    });
  }

  async scheduleVisitReminders(params: {
    userId: string;
    visitId: string;
    housingId: string;
    housingTitle?: string;
    visitDate: Date;
    collectorId?: string;
    clientName?: string;
  }): Promise<void> {
    if (!this.isConfigured) {
      return;
    }
    const { userId, visitId, housingId, housingTitle, visitDate, collectorId, clientName } = params;
    const logement = housingTitle ?? 'le logement';
    const client = clientName ?? 'un client';

    const msDay = 24 * 60 * 60 * 1000;
    const msHour = 60 * 60 * 1000;
    const ms30Min = 30 * 60 * 1000;

    // Client reminders
    const clientScheduleItems: {
      type: NotificationType;
      offsetMs: number;
      title: string;
      body: string;
    }[] = [
      {
        type: NotificationType.VISIT_REMINDER_J2,
        offsetMs: -2 * msDay,
        title: 'Rappel de visite (J-2)',
        body: `Vous avez une visite pour ${logement} dans 2 jours.`,
      },
      {
        type: NotificationType.VISIT_REMINDER_J1,
        offsetMs: -1 * msDay,
        title: 'Rappel de visite (J-1)',
        body: `Vous avez une visite pour ${logement} demain.`,
      },
      {
        type: NotificationType.VISIT_REMINDER_H2,
        offsetMs: -2 * msHour,
        title: 'Rappel de visite (H-2)',
        body: `Vous avez une visite pour ${logement} dans 2 heures.`,
      },
      {
        type: NotificationType.VISIT_REMINDER_H1,
        offsetMs: -1 * msHour,
        title: 'Rappel de visite (H-1)',
        body: `Vous avez une visite pour ${logement} dans 1 heure.`,
      },
      {
        type: NotificationType.VISIT_REMINDER_H30,
        offsetMs: -ms30Min,
        title: 'Rappel de visite (30 min)',
        body: `Vous avez une visite pour ${logement} dans 30 minutes.`,
      },
    ];

    // Collector reminders
    const collectorScheduleItems: {
      type: NotificationType;
      offsetMs: number;
      title: string;
      body: string;
    }[] = [
      {
        type: NotificationType.VISIT_REMINDER_COLLECTOR_J2,
        offsetMs: -2 * msDay,
        title: 'Rappel de visite (J-2)',
        body: `Vous avez une visite avec ${client} pour ${logement} dans 2 jours.`,
      },
      {
        type: NotificationType.VISIT_REMINDER_COLLECTOR_J1,
        offsetMs: -1 * msDay,
        title: 'Rappel de visite (J-1)',
        body: `Vous avez une visite avec ${client} pour ${logement} demain.`,
      },
      {
        type: NotificationType.VISIT_REMINDER_COLLECTOR_H2,
        offsetMs: -2 * msHour,
        title: 'Rappel de visite (H-2)',
        body: `Vous avez une visite avec ${client} pour ${logement} dans 2 heures.`,
      },
      {
        type: NotificationType.VISIT_REMINDER_COLLECTOR_H1,
        offsetMs: -1 * msHour,
        title: 'Rappel de visite (H-1)',
        body: `Vous avez une visite avec ${client} pour ${logement} dans 1 heure.`,
      },
      {
        type: NotificationType.VISIT_REMINDER_COLLECTOR_H30,
        offsetMs: -ms30Min,
        title: 'Rappel de visite (30 min)',
        body: `Vous avez une visite avec ${client} pour ${logement} dans 30 minutes.`,
      },
    ];

    const batch = this.firestore.batch();
    const now = new Date();

    // Schedule client reminders
    for (const item of clientScheduleItems) {
      const scheduledAt = new Date(visitDate.getTime() + item.offsetMs);
      if (scheduledAt <= now) continue;

      const docRef = this.firestore.collection('notifications-scheduled').doc();
      const scheduledData: Omit<ScheduledNotification, 'id'> = {
        userId,
        visitId,
        housingId,
        type: item.type,
        title: item.title,
        body: item.body,
        scheduledAt,
        processed: false,
        role: 'CLIENT',
        createdAt: this.firebase.firestore.FieldValue.serverTimestamp(),
      };
      batch.set(docRef, scheduledData);
    }

    // Schedule collector reminders if collectorId is provided
    if (collectorId) {
      for (const item of collectorScheduleItems) {
        const scheduledAt = new Date(visitDate.getTime() + item.offsetMs);
        if (scheduledAt <= now) continue;

        const docRef = this.firestore.collection('notifications-scheduled').doc();
        const scheduledData: Omit<ScheduledNotification, 'id'> = {
          userId: collectorId,
          visitId,
          housingId,
          type: item.type,
          title: item.title,
          body: item.body,
          scheduledAt,
          processed: false,
          role: 'COLLECTOR',
          createdAt: this.firebase.firestore.FieldValue.serverTimestamp(),
        };
        batch.set(docRef, scheduledData);
      }
    }

    await batch.commit();
  }

  async processScheduledReminders(): Promise<void> {
    if (!this.isConfigured) {
      return;
    }
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);

      const snap = await this.firestore
        .collection('notifications-scheduled')
        .where('processed', '==', false)
        .where('scheduledAt', '>=', fiveMinutesAgo)
        .where('scheduledAt', '<=', fiveMinutesLater)
        .get();

      if (snap.empty) return;

      const batch = this.firestore.batch();

      for (const doc of snap.docs) {
        const data = doc.data() as ScheduledNotification;

        await this.sendAndStoreNotification({
          userId: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          visitId: data.visitId,
          housingId: data.housingId,
          role: data.role || 'CLIENT',
          sentBy: data.role === 'COLLECTOR' ? 'CLIENT' : 'COLLECTOR',
        });

        batch.update(doc.ref, {
          processed: true,
          processedAt: this.firebase.firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
    } catch (error: any) {
      // Erreur NOT_FOUND peut se produire si la collection n'existe pas encore ou si un index est manquant
      if (error?.code === 5 || error?.code === 'NOT_FOUND') {
        console.warn('[NotificationsFirebaseService] Collection notifications-scheduled non trouvée ou index manquant. Cela est normal si aucune notification planifiée n\'a encore été créée.');
        return;
      }
      console.error('[NotificationsFirebaseService] Erreur lors du traitement des rappels planifiés:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string): Promise<FirebaseNotificationResponseDto[]> {
    if (!this.isConfigured) {
      return [];
    }
    try {
      const snap = await this.firestore
        .collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snap.docs.map((d) => {
        const data = d.data();
        const createdAt = data.createdAt?.toDate 
          ? data.createdAt.toDate() 
          : (data.createdAt instanceof Date 
            ? data.createdAt 
            : new Date());
        
        return {
          id: d.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          visitId: data.visitId ?? null,
          housingId: data.housingId ?? null,
          role: data.role,
          isRead: data.isRead,
          sentBy: data.sentBy,
          createdAt,
        } as FirebaseNotificationResponseDto;
      });
    } catch (error: any) {
      // Erreur NOT_FOUND peut se produire si la collection n'existe pas encore ou si un index composite est manquant
      if (error?.code === 5 || error?.code === 'NOT_FOUND') {
        console.warn('[NotificationsFirebaseService] Collection notifications non trouvée ou index composite manquant. Retour d\'un tableau vide.');
        return [];
      }
      console.error('[NotificationsFirebaseService] Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    if (!this.isConfigured) {
      return;
    }
    const ref = this.firestore.collection('notifications').doc(notificationId);
    const snap = await ref.get();
    if (!snap.exists) return;

    const data = snap.data() as any;
    if (data.userId !== userId) return;

    await ref.update({ isRead: true });
  }

  async sendTestNotification(userId: string, title: string, body: string): Promise<void> {
    if (!this.isConfigured) {
      console.warn('[NotificationsFirebaseService] Firebase non configuré, notification de test non envoyée');
      return;
    }

    await this.sendAndStoreNotification({
      userId,
      type: NotificationType.VISIT_ACCEPTED, // Type par défaut pour les tests
      title,
      body,
      role: 'CLIENT',
      sentBy: 'COLLECTOR',
    });
  }
}


