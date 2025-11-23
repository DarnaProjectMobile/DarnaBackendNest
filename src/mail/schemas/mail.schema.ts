import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MailDocument = HydratedDocument<Mail>;

@Schema({ timestamps: true })
export class Mail {
  @Prop({ required: true, type: String })
  to: string; // Email destinataire

  @Prop({ required: true, type: String })
  from: string; // Email expéditeur

  @Prop({ required: true })
  subject: string; // Sujet de l'email

  @Prop({ required: true })
  content: string; // Contenu de l'email

  @Prop({ required: false, type: String })
  userId?: string; // ID de l'utilisateur concerné (optionnel)

  @Prop({ default: false })
  sent: boolean; // Email envoyé ou non

  @Prop({ default: false })
  read: boolean; // Email lu ou non

  @Prop({ required: false, type: [String], default: [] })
  attachments?: string[]; // Pièces jointes
}

export const MailSchema = SchemaFactory.createForClass(Mail);









