import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentsDocument = HydratedDocument<Payments>;

@Schema({ timestamps: true })
export class Payments {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: false })
  transactionId?: string;

  @Prop({ required: false })
  description?: string;
}

export const PaymentsSchema = SchemaFactory.createForClass(Payments);