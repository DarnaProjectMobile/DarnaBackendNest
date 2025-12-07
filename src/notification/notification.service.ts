import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface BookingNotificationPayload {
  annonceId: string;
  annonceTitle: string;
  bookingDate: string;
  bookingUserName?: string;
  type: 'BOOKING_REQUEST' | 'BOOKING_RESPONSE';
  accepted?: 'true' | 'false';
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly configService: ConfigService) {
    this.initializeFirebaseApp();
  }

  private initializeFirebaseApp() {
    if (admin.apps.length > 0) {
      return;
    }

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase credentials are missing. Push notifications are disabled.',
      );
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    this.logger.log('Firebase app initialized for push notifications');
  }

  async sendPushToTokens(
    tokens: string[],
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ) {
    if (!tokens.length) {
      this.logger.debug('No device tokens provided. Skipping notification.');
      return;
    }

    if (!admin.apps.length) {
      this.logger.warn(
        'Firebase is not configured. Cannot send push notification.',
      );
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification,
      data,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      if (response.failureCount > 0) {
        this.logger.warn(
          `Notification sent with ${response.failureCount} failures`,
        );
      } else {
        this.logger.debug(
          `Notification successfully sent to ${response.successCount} devices`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to send push notification', error as Error);
    }
  }

  async notifyBookingRequest(
    ownerTokens: string[],
    payload: BookingNotificationPayload,
  ) {
    const { bookingUserName, annonceTitle, bookingDate } = payload;
    await this.sendPushToTokens(
      ownerTokens,
      {
        title: 'Nouvelle demande de réservation',
        body: `${bookingUserName ?? 'Un utilisateur'} veut réserver "${annonceTitle}" à partir du ${bookingDate}`,
      },
      {
        ...payload,
        type: 'BOOKING_REQUEST',
      },
    );
  }

  async notifyBookingResponse(
    clientTokens: string[],
    payload: BookingNotificationPayload,
  ) {
    const accepted = payload.accepted === 'true';
    await this.sendPushToTokens(
      clientTokens,
      {
        title: accepted
          ? 'Votre réservation a été acceptée'
          : 'Votre réservation a été refusée',
        body: accepted
          ? `Votre demande pour "${payload.annonceTitle}" est acceptée.`
          : `Votre demande pour "${payload.annonceTitle}" a été refusée.`,
      },
      {
        ...payload,
        type: 'BOOKING_RESPONSE',
        accepted: accepted ? 'true' : 'false',
      },
    );
  }

  // --- Legacy methods kept for controller compatibility ---
  create(body?: unknown) {
    return {
      message: 'Use booking flows to trigger notifications automatically.',
      body,
    };
  }

  findAll() {
    return {
      message: 'Notifications are handled via push; listing is not implemented.',
    };
  }

  findOne(id?: number | string) {
    return { message: 'Not implemented.', id };
  }

  update(id?: number | string, body?: unknown) {
    return { message: 'Not implemented.', id, body };
  }

  remove(id?: number | string) {
    return { message: 'Not implemented.', id };
  }
}
