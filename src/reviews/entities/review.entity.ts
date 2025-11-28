import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Review extends Document {
  @ApiProperty({ example: 5, description: 'Rating between 1 and 5' })
  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @ApiProperty({ example: 'Excellent service!', description: 'Review comment' })
  @Prop({ required: true })
  comment: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
user: Types.ObjectId;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
