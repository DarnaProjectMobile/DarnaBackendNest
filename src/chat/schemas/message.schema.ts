import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true, type: String })
  visiteId: string; // Référence à la visite

  @Prop({ required: true, type: String })
  senderId: string; // ID de l'utilisateur qui envoie le message

  @Prop({ required: true, type: String })
  receiverId: string; // ID de l'utilisateur qui reçoit le message

  @Prop({ required: false, type: String })
  content?: string; // Contenu du message (optionnel si image)

  @Prop({ type: [String], default: [] })
  images?: string[]; // URLs des images uploadées

  @Prop({ default: false })
  read: boolean; // Message lu ou non

  @Prop({ type: Date, default: null })
  readAt?: Date; // Date de lecture

  @Prop({ default: 'text' })
  type: string; // Type de message: 'text', 'image', 'text_image'

  // Nouveaux champs pour suppression, modification et statuts
  @Prop({ default: false })
  isDeleted: boolean; // Message supprimé (soft delete)

  @Prop({ default: false })
  isEdited: boolean; // Message modifié

  @Prop({ type: Date, default: null })
  editedAt?: Date; // Date de dernière modification

  @Prop({ default: 'sent' })
  status: string; // Statut du message: 'sent', 'delivered', 'read'

  @Prop({ type: Date, default: null })
  deliveredAt?: Date; // Date de réception par le destinataire

  // Réactions aux messages (emoji -> liste d'IDs utilisateurs)
  @Prop({ type: Object, default: {} })
  reactions: Record<string, string[]>; // { "👍": ["userId1", "userId2"], "❤️": ["userId3"] }
}

export const MessageSchema = SchemaFactory.createForClass(Message);

