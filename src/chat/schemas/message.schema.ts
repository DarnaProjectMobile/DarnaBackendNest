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

  @Prop({ type: Date, default: Date.now })
  readAt?: Date; // Date de lecture

  @Prop({ default: 'text' })
  type: string; // Type de message: 'text', 'image', 'text_image'
}

export const MessageSchema = SchemaFactory.createForClass(Message);

