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

  @ApiProperty({ description: 'User who submitted the review' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;
 
  @ApiProperty({ description: 'Property being reviewed' })
  @Prop({ type: Types.ObjectId, ref: 'Annonce', required: true })
  property: Types.ObjectId;

  @ApiProperty({ description: 'Name of the user who submitted the review' })
  @Prop({ required: true })
  userName: string;
 
  @ApiProperty({ description: 'Name of the property being reviewed' })
  @Prop({ required: true })
  propertyName: string;
  
  // Champs de date gérés automatiquement par Mongoose
  createdAt: Date;
  updatedAt: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);