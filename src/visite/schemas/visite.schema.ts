import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VisiteDocument = HydratedDocument<Visite>;

@Schema({ timestamps: true })
export class Visite {
  @Prop({ required: true, type: String })
  logementId: string; // Référence au logement

  @Prop({ required: true, type: String })
  userId: string; // Référence à l'utilisateur qui demande la visite

  @Prop({ required: true })
  dateVisite: Date; // Date et heure de la visite

  @Prop({ required: false, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'refused'], default: 'pending' })
  status: string; // Statut: 'pending', 'confirmed', 'completed', 'cancelled' (par client), 'refused' (par collecteur)

  @Prop({ required: false })
  notes?: string; // Notes optionnelles

  @Prop({ required: false })
  contactPhone?: string; // Téléphone de contact

  @Prop({ type: [String], default: [] })
  documents?: string[]; // Documents uploadés (factures, etc.)

  @Prop({ default: false })
  validated?: boolean; // Visite validée par le client

  @Prop({ required: false })
  reviewId?: string; // Référence à la review/évaluation

}

export const VisiteSchema = SchemaFactory.createForClass(Visite);

