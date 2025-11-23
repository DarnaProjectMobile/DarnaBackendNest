import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, type: String })
  userId: string; // ID de l'utilisateur destinataire

  @Prop({ required: true })
  title: string; // Titre de la notification

  @Prop({ required: true })
  message: string; // Message de la notification

  @Prop({ required: false, enum: ['info', 'warning', 'error', 'success'], default: 'info' })
  type?: string; // Type de notification

  @Prop({ required: false, type: String })
  visiteId?: string; // ID de la visite concernée (si applicable)

  @Prop({ default: false })
  read: boolean; // Notification lue ou non

  @Prop({ default: true })
  active: boolean; // Notification active (pour les alertes de dates)

  @Prop({ required: false })
  actionUrl?: string; // URL d'action (optionnel)
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);









