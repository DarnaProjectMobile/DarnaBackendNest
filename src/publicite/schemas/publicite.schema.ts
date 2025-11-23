import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PubliciteDocument = HydratedDocument<Publicite>;

@Schema({ timestamps: true })
export class Publicite {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  image: string;

  @Prop()
  link?: string;

  @Prop({ default: true })
  isActive?: boolean;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: Number, default: 0 })
  views?: number;

  @Prop({ type: Number, default: 0 })
  clicks?: number;
}

export const PubliciteSchema = SchemaFactory.createForClass(Publicite);

