import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

@Schema({ timestamps: true })
export class Report {
  @Prop({ required: true, type: String })
  reporterId: string; // ID de l'utilisateur qui fait le signalement

  @Prop({ required: true, type: String })
  reportedId: string; // ID de l'utilisateur ou entité signalée

  @Prop({ required: true, enum: ['user', 'annonce', 'logement', 'visite', 'review'] })
  reportedType: string; // Type d'entité signalée

  @Prop({ required: true })
  reason: string; // Raison du signalement

  @Prop({ required: false })
  description?: string; // Description détaillée

  @Prop({ default: 'pending', enum: ['pending', 'reviewed', 'resolved', 'dismissed'] })
  status?: string; // Statut du signalement

  @Prop({ required: false, type: [String], default: [] })
  evidence?: string[]; // Preuves (images, screenshots, etc.)

  @Prop({ required: false, type: String })
  adminNotes?: string; // Notes de l'administrateur
}

export const ReportSchema = SchemaFactory.createForClass(Report);









