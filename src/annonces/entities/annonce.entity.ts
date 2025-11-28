import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AnnonceDocument = HydratedDocument<Annonce>;

@Schema({ timestamps: true })
export class Annonce {
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true, type: Number })
  nbrCollocateurMax: number;

  @Prop({ required: true, type: Number, default: 0 })
  nbrCollocateurActuel: number;

  @Prop({ type: [String], required: true })
  images: string[];

  @Prop({
    required: true,
    enum: ['S', 'S+1', 'S+2', 'S+3', 'S+4', 'Chambre'],
  })
  type: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  // ✅ Booking list
  @Prop({
    type: [
      {
        user: { type: Types.ObjectId, ref: 'User' },
        bookingStartDate: Date,
      },
    ],
    default: [],
    _id: true, // make subdocuments have _id
  })
  bookings: {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    bookingStartDate: Date;
  }[];

  // ✅ Attending list (pending bookings)
  @Prop({
    type: [
      {
        user: { type: Types.ObjectId, ref: 'User' },
        bookingStartDate: Date,
      },
    ],
    default: [],
    _id: true,
  })
  attendingListBookings: {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    bookingStartDate: Date;
  }[];
}

export const AnnonceSchema = SchemaFactory.createForClass(Annonce);
