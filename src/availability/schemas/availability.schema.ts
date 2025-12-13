
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AvailabilityDocument = Availability & Document;

@Schema({ timestamps: true })
export class Availability {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: string; // The owner ID

    @Prop({ type: [Number], default: [] }) // 0=Sunday, 1=Monday, ...
    availableDays: number[];

    @Prop({ type: [Date], default: [] })
    unavailableDates: Date[];

    @Prop({
        type: [
            {
                startTime: { type: String, required: true }, // "09:00"
                endTime: { type: String, required: true },   // "17:00"
            },
        ],
        default: [],
    })
    availableTimeSlots: { startTime: string; endTime: string }[];
}

export const AvailabilitySchema = SchemaFactory.createForClass(Availability);
