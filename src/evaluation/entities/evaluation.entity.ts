import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EvaluationDocument = HydratedDocument<Evaluation>;

@Schema({ timestamps: true })
export class Evaluation {
  @Prop({ required: true, type: String })
  userId: string; // Référence à l'utilisateur évalué

  @Prop({ required: true, type: String })
  evaluatorId: string; // Référence à l'utilisateur qui évalue

  @Prop({ required: true, min: 1, max: 5 })
  rating: number; // Note de 1 à 5

  @Prop({ required: false })
  comment?: string; // Commentaire optionnel

  @Prop({ required: false, type: String })
  logementId?: string; // Référence optionnelle au logement concerné
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation);
