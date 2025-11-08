import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, type: String })
  userId: string; // Référence à l'utilisateur destinataire

  @Prop({ required: true })
  title: string; // Titre de la notification

  @Prop({ required: true })
  message: string; // Message de la notification

  @Prop({ default: false })
  isRead: boolean; // Statut de lecture

  @Prop({ required: false })
  type?: string; // Type de notification (ex: 'visite', 'message', 'evaluation', etc.)

  @Prop({ required: false, type: Object })
  data?: Record<string, any>; // Données supplémentaires
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
