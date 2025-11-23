import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AnnonceDocument = HydratedDocument<Annonce>;

@Schema({ timestamps: true })
export class Annonce {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  ownerId: string;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ default: true })
  isActive?: boolean;
}

export const AnnonceSchema = SchemaFactory.createForClass(Annonce);

