import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PubliciteDocument = HydratedDocument<Publicite>;

@Schema({ timestamps: true })
export class Publicite {
  @Prop({ required: true })
  titre: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  type: string;

  @Prop({ type: Number, default: null })
  pourcentageReduction: number;

  @Prop()
  imageUrl: string;

  @Prop({ type: Date, default: Date.now })
  dateDebut: Date;

  @Prop({ type: Date })
  dateFin: Date;

  // ✅ Relation correcte vers User
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  partenaire: Types.ObjectId;
}

export const PubliciteSchema = SchemaFactory.createForClass(Publicite);
