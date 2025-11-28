import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ timestamps: true })
export class Review {
  @Prop({ required: true, type: String })
  visiteId: string; // Référence à la visite

  @Prop({ required: true, type: String })
  userId: string; // Client qui fait la review

  @Prop({ required: false, type: String })
  logementId?: string; // Logement visité

  @Prop({ required: false, type: String })
  collectorId?: string; // Propriétaire / collector

  @Prop({ required: true, type: Number, min: 1, max: 5 })
  rating: number; // Note de 1 à 5

  @Prop({ required: true, type: Number, min: 1, max: 5 })
  collectorRating: number; // Note spécifique du collector

  @Prop({ required: true, type: Number, min: 1, max: 5 })
  cleanlinessRating: number; // Propreté du logement

  @Prop({ required: true, type: Number, min: 1, max: 5 })
  locationRating: number; // Localisation du logement

  @Prop({ required: true, type: Number, min: 1, max: 5 })
  conformityRating: number; // Conformité à l’annonce

  @Prop({ required: false })
  comment?: string; // Commentaire optionnel
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
