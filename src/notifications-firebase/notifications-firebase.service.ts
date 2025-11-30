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
      let snap;
      try {
        snap = await userTokensRef.get();
      } catch (getError: any) {
        // L'erreur NOT_FOUND lors d'un get() est normale si le document n'existe pas
        // On continue pour créer le document
        console.log(`[NotificationsFirebaseService] Document n'existe pas encore pour l'utilisateur ${userId}, création...`);
        snap = null; // On va créer le document
      }
      
      // Utiliser Timestamp.now() au lieu de FieldValue.serverTimestamp() car on ne peut pas utiliser FieldValue dans un tableau
      const now = this.firebase.firestore.Timestamp.now();

      if (!snap || !snap.exists) {
        console.log(`[NotificationsFirebaseService] Création du document pour l'utilisateur ${userId}`);
        const newToken: UserToken = { token: fcmToken, platform, updatedAt: now };
        const userTokensDoc: UserTokensDocument = {
          userId,
          tokens: [newToken],
        };
        try {
          await userTokensRef.set(userTokensDoc);
          console.log(`[NotificationsFirebaseService] ✅ Token FCM enregistré pour l'utilisateur ${userId}`);
          console.log(`[NotificationsFirebaseService] Token: ${fcmToken.substring(0, 20)}... (${fcmToken.length} caractères)`);
          return;
        } catch (setError: any) {
          console.error(`[NotificationsFirebaseService] Erreur lors de la création du document:`, setError);
          console.error(`[NotificationsFirebaseService] Code d'erreur: ${setError?.code}, Message: ${setError?.message}`);
          // Si c'est une erreur NOT_FOUND, cela peut signifier que Firestore n'est pas initialisé
          if (setError?.code === 5 || setError?.code === 'NOT_FOUND') {
            throw new Error('Firestore n\'est pas initialisé. Veuillez initialiser Firestore dans Firebase Console (mode Test ou Production).');
          }
          throw setError;
        }
      }

      const data = snap.data() as UserTokensDocument | undefined;
      const existingTokens: UserToken[] = data?.tokens ?? [];
      const filtered = existingTokens.filter((t: UserToken) => t.token !== fcmToken);
      const newToken: UserToken = { token: fcmToken, platform, updatedAt: now };
      filtered.push(newToken);

      await userTokensRef.update({ tokens: filtered });
      console.log(`[NotificationsFirebaseService] ✅ Token FCM mis à jour pour l'utilisateur ${userId}`);
      console.log(`[NotificationsFirebaseService] Token: ${fcmToken.substring(0, 20)}... (${fcmToken.length} caractères)`);
    } catch (error: any) {
      console.error('[NotificationsFirebaseService] Erreur lors de l\'enregistrement du token FCM:', error);
      console.error('[NotificationsFirebaseService] Code d\'erreur:', error?.code);
      console.error('[NotificationsFirebaseService] Message:', error?.message);
      console.error('[NotificationsFirebaseService] Détails:', error?.details);
      
      // Si c'est une erreur NOT_FOUND, cela signifie probablement que Firestore n'est pas initialisé
      if (error?.code === 5 || error?.code === 'NOT_FOUND') {
        const errorMsg = `Firestore n'est pas initialisé ou les règles de sécurité bloquent l'écriture. 
Veuillez :
1. Aller dans Firebase Console (https://console.firebase.google.com)
2. Sélectionner votre projet
3. Aller dans Firestore Database
4. Cliquer sur "Créer une base de données" si elle n'existe pas
5. Choisir le mode "Test" (pour développement) ou configurer les règles de sécurité appropriées
6. Vérifier que les règles permettent l'écriture pour le compte de service`;
        throw new Error(errorMsg);
      }
      
      const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
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
    let snap;
    let userTokensData: UserTokensDocument | null = null;
    try {
      snap = await userTokensRef.get();
      userTokensData = snap.exists ? (snap.data() as UserTokensDocument) : null;
    } catch (getError: any) {
      // Si l'erreur est NOT_FOUND, cela signifie que la base de données n'a jamais été utilisée
      // On continue sans tokens (la notification sera quand même créée dans Firestore)
      if (getError?.code === 5 || getError?.code === 'NOT_FOUND') {
        console.warn(`[NotificationsFirebaseService] Impossible de récupérer les tokens pour l'utilisateur ${userId} (base de données non initialisée), notification sera créée sans envoi push`);
        userTokensData = null;
      } else {
        throw getError;
      }
    }
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
    
    console.log(`[NotificationsFirebaseService] Création de la notification pour l'utilisateur ${userId}:`, {
      type,
      title,
      body,
      visitId: visitId ?? null,
      housingId: housingId ?? null,
    });
    
    let notificationRef;
    try {
      notificationRef = await this.firestore.collection('notifications').add(notificationData);
      console.log(`[NotificationsFirebaseService] Notification créée dans Firestore avec l'ID: ${notificationRef.id}`);
    } catch (error: any) {
      // Si c'est une erreur NOT_FOUND, essayer de créer quand même avec set() au lieu de add()
      if (error?.code === 5 || error?.code === 'NOT_FOUND') {
        try {
          console.log(`[NotificationsFirebaseService] Tentative de création de la notification avec set() après erreur NOT_FOUND`);
          const docRef = this.firestore.collection('notifications').doc();
          await docRef.set(notificationData);
          notificationRef = docRef;
          console.log(`[NotificationsFirebaseService] Notification créée dans Firestore avec l'ID: ${notificationRef.id} (après gestion NOT_FOUND)`);
        } catch (retryError: any) {
          console.error('[NotificationsFirebaseService] Échec de la création de la notification même après retry:', retryError);
          // Ne pas faire échouer complètement, juste logger l'erreur
          console.warn('[NotificationsFirebaseService] La notification n\'a pas pu être créée dans Firestore, mais on continue');
          notificationRef = null;
        }
      } else {
        console.error('[NotificationsFirebaseService] Erreur lors de la création de la notification dans Firestore:', error);
        console.error('[NotificationsFirebaseService] Code d\'erreur:', error?.code);
        console.error('[NotificationsFirebaseService] Message:', error?.message);
        // Ne pas faire échouer complètement, juste logger l'erreur
        console.warn('[NotificationsFirebaseService] La notification n\'a pas pu être créée dans Firestore, mais on continue');
        notificationRef = null;
      }
    }

    if (tokens.length === 0) {
      console.warn(`[NotificationsFirebaseService] Aucun token FCM trouvé pour l'utilisateur ${userId}. La notification ${notificationRef?.id || 'N/A'} a été enregistrée dans Firestore mais ne sera pas envoyée.`);
      return;
    }

    if (!notificationRef) {
      console.warn(`[NotificationsFirebaseService] Impossible d'envoyer la notification push car la référence Firestore n'a pas été créée.`);
      return;
    }

    try {
      const response = await this.messaging.sendEachForMulticast({
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

      console.log(`[NotificationsFirebaseService] Notification envoyée: ${response.successCount} succès, ${response.failureCount} échecs`);
      
      if (response.failureCount > 0) {
        // Logger les tokens invalides pour les supprimer
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`[NotificationsFirebaseService] Échec d'envoi pour le token ${idx}: ${resp.error?.code} - ${resp.error?.message}`);
            
            // Si le token est invalide ou non enregistré, on pourrait le supprimer
            if (resp.error?.code === 'messaging/invalid-registration-token' || 
                resp.error?.code === 'messaging/registration-token-not-registered') {
              console.warn(`[NotificationsFirebaseService] Token invalide détecté, devrait être supprimé: ${tokens[idx]?.substring(0, 20)}...`);
            }
          }
        });
      }
    } catch (error: any) {
      console.error('[NotificationsFirebaseService] Erreur lors de l\'envoi de la notification push:', error);
      console.error('[NotificationsFirebaseService] Stack trace:', error?.stack);
      // On ne propage pas l'erreur car la notification est déjà enregistrée dans Firestore
      // L'utilisateur pourra toujours la voir via l'API GET /notifications-firebase
    }
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
      // Convertir la date en Timestamp Firestore pour un stockage cohérent
      const scheduledAtTimestamp = this.firebase.firestore.Timestamp.fromDate(scheduledAt);
      const scheduledData: Omit<ScheduledNotification, 'id'> = {
        userId,
        visitId,
        housingId,
        type: item.type,
        title: item.title,
        body: item.body,
        scheduledAt: scheduledAtTimestamp as any, // Firestore stockera comme Timestamp
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
        // Convertir la date en Timestamp Firestore pour un stockage cohérent
        const scheduledAtTimestamp = this.firebase.firestore.Timestamp.fromDate(scheduledAt);
        const scheduledData: Omit<ScheduledNotification, 'id'> = {
          userId: collectorId,
          visitId,
          housingId,
          type: item.type,
          title: item.title,
          body: item.body,
          scheduledAt: scheduledAtTimestamp as any, // Firestore stockera comme Timestamp
          processed: false,
          role: 'COLLECTOR',
          createdAt: this.firebase.firestore.FieldValue.serverTimestamp(),
        };
        batch.set(docRef, scheduledData);
      }
    }

    try {
      await batch.commit();
      
      // Log pour débogage
      const totalReminders = clientScheduleItems.filter(item => {
        const scheduledAt = new Date(visitDate.getTime() + item.offsetMs);
        return scheduledAt > now;
      }).length + (collectorId ? collectorScheduleItems.filter(item => {
        const scheduledAt = new Date(visitDate.getTime() + item.offsetMs);
        return scheduledAt > now;
      }).length : 0);
      
      console.log(`[NotificationsFirebaseService] ${totalReminders} rappel(s) planifié(s) pour la visite ${visitId} (client: ${userId}, collector: ${collectorId || 'N/A'})`);
    } catch (error: any) {
      // Si c'est une erreur NOT_FOUND, essayer de créer les documents un par un
      if (error?.code === 5 || error?.code === 'NOT_FOUND') {
        console.warn(`[NotificationsFirebaseService] Erreur NOT_FOUND lors du commit batch, tentative de création individuelle des rappels`);
        try {
          // Créer les rappels un par un
          for (const item of clientScheduleItems) {
            const scheduledAt = new Date(visitDate.getTime() + item.offsetMs);
            if (scheduledAt <= now) continue;

            const docRef = this.firestore.collection('notifications-scheduled').doc();
            const scheduledAtTimestamp = this.firebase.firestore.Timestamp.fromDate(scheduledAt);
            const scheduledData: Omit<ScheduledNotification, 'id'> = {
              userId,
              visitId,
              housingId,
              type: item.type,
              title: item.title,
              body: item.body,
              scheduledAt: scheduledAtTimestamp as any,
              processed: false,
              role: 'CLIENT',
              createdAt: this.firebase.firestore.FieldValue.serverTimestamp(),
            };
            try {
              await docRef.set(scheduledData);
            } catch (docError) {
              console.error(`[NotificationsFirebaseService] Erreur lors de la création du rappel ${item.type}:`, docError);
            }
          }

          if (collectorId) {
            for (const item of collectorScheduleItems) {
              const scheduledAt = new Date(visitDate.getTime() + item.offsetMs);
              if (scheduledAt <= now) continue;

              const docRef = this.firestore.collection('notifications-scheduled').doc();
              const scheduledAtTimestamp = this.firebase.firestore.Timestamp.fromDate(scheduledAt);
              const scheduledData: Omit<ScheduledNotification, 'id'> = {
                userId: collectorId,
                visitId,
                housingId,
                type: item.type,
                title: item.title,
                body: item.body,
                scheduledAt: scheduledAtTimestamp as any,
                processed: false,
                role: 'COLLECTOR',
                createdAt: this.firebase.firestore.FieldValue.serverTimestamp(),
              };
              try {
                await docRef.set(scheduledData);
              } catch (docError) {
                console.error(`[NotificationsFirebaseService] Erreur lors de la création du rappel collector ${item.type}:`, docError);
              }
            }
          }
          console.log(`[NotificationsFirebaseService] Rappels créés individuellement après gestion de l'erreur NOT_FOUND`);
        } catch (retryError) {
          console.error('[NotificationsFirebaseService] Échec de la création individuelle des rappels:', retryError);
          throw retryError;
        }
      } else {
        console.error('[NotificationsFirebaseService] Erreur lors du commit batch des rappels:', error);
        throw error;
      }
    }
  }

  async processScheduledReminders(): Promise<void> {
    if (!this.isConfigured) {
      return;
    }
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);

      // Convertir les dates en Timestamp Firestore pour la requête
      const fiveMinutesAgoTimestamp = this.firebase.firestore.Timestamp.fromDate(fiveMinutesAgo);
      const fiveMinutesLaterTimestamp = this.firebase.firestore.Timestamp.fromDate(fiveMinutesLater);

      let snap;
      try {
        // Essayer d'abord avec la requête optimisée (nécessite un index composite)
        snap = await this.firestore
          .collection('notifications-scheduled')
          .where('processed', '==', false)
          .where('scheduledAt', '>=', fiveMinutesAgoTimestamp)
          .where('scheduledAt', '<=', fiveMinutesLaterTimestamp)
          .get();
      } catch (queryError: any) {
        // Si l'index composite est manquant, utiliser un fallback
        if (queryError?.code === 9 || queryError?.code === 'FAILED_PRECONDITION' || queryError?.message?.toLowerCase().includes('index')) {
          console.warn('[NotificationsFirebaseService] Index composite manquant, utilisation du fallback (récupération de toutes les notifications non traitées)');
          // Récupérer toutes les notifications non traitées et filtrer en mémoire
          const allUnprocessed = await this.firestore
            .collection('notifications-scheduled')
            .where('processed', '==', false)
            .get();
          
          // Filtrer en mémoire par date
          const filteredDocs = allUnprocessed.docs.filter(doc => {
            const data = doc.data();
            let scheduledAt: Date;
            if (data.scheduledAt?.toDate) {
              scheduledAt = data.scheduledAt.toDate();
            } else if (data.scheduledAt instanceof Date) {
              scheduledAt = data.scheduledAt;
            } else {
              scheduledAt = new Date(data.scheduledAt);
            }
            return scheduledAt >= fiveMinutesAgo && scheduledAt <= fiveMinutesLater;
          });
          
          // Créer un QuerySnapshot mock avec les documents filtrés
          snap = {
            empty: filteredDocs.length === 0,
            docs: filteredDocs,
          } as any;
        } else {
          throw queryError;
        }
      }

      if (snap.empty) {
        return;
      }

      console.log(`[NotificationsFirebaseService] Traitement de ${snap.docs.length} rappel(s) planifié(s)`);

      const batch = this.firestore.batch();

      for (const doc of snap.docs) {
        const data = doc.data();
        
        // Convertir le Timestamp Firestore en Date si nécessaire
        let scheduledAt: Date;
        if (data.scheduledAt?.toDate) {
          scheduledAt = data.scheduledAt.toDate();
        } else if (data.scheduledAt instanceof Date) {
          scheduledAt = data.scheduledAt;
        } else {
          scheduledAt = new Date(data.scheduledAt);
        }

        // Vérifier que la date est bien dans la fenêtre de temps
        if (scheduledAt < fiveMinutesAgo || scheduledAt > fiveMinutesLater) {
          continue;
        }

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

      const batchSize = snap.docs.length;
      if (batchSize > 0) {
        try {
          await batch.commit();
          console.log(`[NotificationsFirebaseService] ${batchSize} rappel(s) marqué(s) comme traité(s)`);
        } catch (commitError: any) {
          // Si c'est une erreur NOT_FOUND, essayer de mettre à jour individuellement
          if (commitError?.code === 5 || commitError?.code === 'NOT_FOUND') {
            console.warn(`[NotificationsFirebaseService] Erreur NOT_FOUND lors du commit batch, tentative de mise à jour individuelle`);
            for (const doc of snap.docs) {
              try {
                await doc.ref.update({
                  processed: true,
                  processedAt: this.firebase.firestore.FieldValue.serverTimestamp(),
                });
              } catch (updateError) {
                console.error(`[NotificationsFirebaseService] Erreur lors de la mise à jour individuelle du document ${doc.id}:`, updateError);
              }
            }
          } else {
            console.error('[NotificationsFirebaseService] Erreur lors du commit batch:', commitError);
            throw commitError;
          }
        }
      }
    } catch (error: any) {
      // Erreurs possibles :
      // - Code 5 (NOT_FOUND) : Collection n'existe pas encore
      // - Code 9 (FAILED_PRECONDITION) : Index composite manquant
      // - Message contenant "index" : Index manquant
      const isNotFoundError = error?.code === 5 || error?.code === 'NOT_FOUND';
      const isMissingIndexError = error?.code === 9 || 
                                  error?.code === 'FAILED_PRECONDITION' ||
                                  error?.message?.toLowerCase().includes('index');
      
      if (isNotFoundError || isMissingIndexError) {
        // C'est normal si aucune notification planifiée n'a encore été créée
        // ou si l'index composite n'a pas encore été créé dans Firestore
        // Utilisation de console.debug au lieu de console.warn car c'est un comportement attendu
        // et non une erreur réelle
        return;
      }
      console.error('[NotificationsFirebaseService] Erreur lors du traitement des rappels planifiés:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string): Promise<FirebaseNotificationResponseDto[]> {
    if (!this.isConfigured) {
      console.warn('[NotificationsFirebaseService] Firebase non configuré, retour d\'un tableau vide');
      return [];
    }
    try {
      // Essayer d'abord avec orderBy (nécessite un index composite)
      let snap;
      try {
        snap = await this.firestore
          .collection('notifications')
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .get();
      } catch (orderByError: any) {
        // Si l'index composite n'existe pas, récupérer sans orderBy et trier en mémoire
        if (orderByError?.code === 5 || orderByError?.code === 'NOT_FOUND' || orderByError?.message?.includes('index')) {
          console.warn('[NotificationsFirebaseService] Index composite manquant, récupération sans orderBy et tri en mémoire');
          snap = await this.firestore
            .collection('notifications')
            .where('userId', '==', userId)
            .get();
        } else {
          throw orderByError;
        }
      }

      const notifications = snap.docs.map((d) => {
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

      // Si on a récupéré sans orderBy, trier en mémoire par createdAt décroissant
      if (notifications.length > 0 && !snap.empty) {
        notifications.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
          const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
          return dateB - dateA; // Tri décroissant
        });
      }

      console.log(`[NotificationsFirebaseService] ${notifications.length} notification(s) récupérée(s) pour l'utilisateur ${userId}`);
      return notifications;
    } catch (error: any) {
      // Erreur NOT_FOUND peut se produire si la collection n'existe pas encore
      if (error?.code === 5 || error?.code === 'NOT_FOUND') {
        console.warn('[NotificationsFirebaseService] Collection notifications non trouvée. Cela est normal si aucune notification n\'a encore été créée.');
        return [];
      }
      console.error('[NotificationsFirebaseService] Erreur lors de la récupération des notifications:', error);
      console.error('[NotificationsFirebaseService] Code d\'erreur:', error?.code);
      console.error('[NotificationsFirebaseService] Message:', error?.message);
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

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    if (!this.isConfigured) {
      return;
    }
    const ref = this.firestore.collection('notifications').doc(notificationId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new Error('Notification non trouvée');
    }

    const data = snap.data() as any;
    if (data.userId !== userId) {
      throw new Error('Vous n\'êtes pas autorisé à supprimer cette notification');
    }

    await ref.delete();
  }

  async sendTestNotification(userId: string, title: string, body: string): Promise<void> {
    if (!this.isConfigured) {
      console.warn('[NotificationsFirebaseService] Firebase non configuré, notification de test non envoyée');
      throw new Error('Firebase n\'est pas configuré. Vérifiez que le fichier firebase-service-account.json existe.');
    }

    console.log(`[NotificationsFirebaseService] Envoi d'une notification de test pour l'utilisateur ${userId}`);
    console.log(`[NotificationsFirebaseService] Titre: ${title}, Corps: ${body}`);

    await this.sendAndStoreNotification({
      userId,
      type: NotificationType.VISIT_ACCEPTED, // Type par défaut pour les tests
      title,
      body,
      role: 'CLIENT',
      sentBy: 'COLLECTOR',
    });

    console.log(`[NotificationsFirebaseService] Notification de test envoyée avec succès pour l'utilisateur ${userId}`);
  }
}


