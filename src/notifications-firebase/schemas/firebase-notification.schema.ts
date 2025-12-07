import { NotificationType } from '../notification-type.enum';

/**
 * Schéma pour une notification Firebase stockée dans Firestore
 */
export interface FirebaseNotification {
  id?: string; // ID du document Firestore
  userId: string; // ID de l'utilisateur destinataire
  type: NotificationType; // Type de notification
  title: string; // Titre de la notification
  body: string; // Corps du message
  visitId: string | null; // ID de la visite associée (optionnel)
  housingId: string | null; // ID du logement associé (optionnel)
  role: 'CLIENT' | 'COLLECTOR'; // Rôle de l'utilisateur destinataire
  isRead: boolean; // Statut de lecture
  sentBy: 'CLIENT' | 'COLLECTOR'; // Rôle de l'expéditeur
  createdAt: Date | FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue; // Date de création
}

/**
 * Schéma pour une notification planifiée dans Firestore
 */
export interface ScheduledNotification {
  id?: string; // ID du document Firestore
  userId: string; // ID de l'utilisateur destinataire
  visitId: string; // ID de la visite associée
  housingId: string; // ID du logement associé
  type: NotificationType; // Type de notification
  title: string; // Titre de la notification
  body: string; // Corps du message
  scheduledAt: Date; // Date/heure prévue pour l'envoi
  processed: boolean; // Indique si la notification a été traitée
  role: 'CLIENT' | 'COLLECTOR'; // Rôle de l'utilisateur destinataire
  createdAt: Date | FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue; // Date de création
  processedAt?: Date | FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue; // Date de traitement (si traité)
}

/**
 * Schéma pour un token FCM d'un utilisateur
 */
export interface UserToken {
  token: string; // Token FCM
  platform: 'ANDROID' | 'IOS' | 'WEB'; // Plateforme
  updatedAt: Date | FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue; // Date de mise à jour
}

/**
 * Schéma pour le document userTokens dans Firestore
 */
export interface UserTokensDocument {
  userId: string; // ID de l'utilisateur
  tokens: UserToken[]; // Liste des tokens FCM
}

