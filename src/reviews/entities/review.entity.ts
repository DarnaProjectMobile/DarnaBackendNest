import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Review extends Document {
  @ApiProperty({ example: 5, description: 'Rating between 1 and 5' })
  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @ApiProperty({ example: 'Excellent service!', description: 'Review comment', required: false })
  @Prop({ required: false })
  comment: string;

  @ApiProperty({ description: 'User who submitted the review' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @ApiProperty({ description: 'Property being reviewed', required: false })
  @Prop({ type: Types.ObjectId, ref: 'Annonce', required: false })
  property: Types.ObjectId;

  @ApiProperty({ description: 'Visit associated with the review', required: false })
  @Prop({ type: Types.ObjectId, ref: 'Visite', required: false })
  visiteId: Types.ObjectId;

  @ApiProperty({ description: 'Collector (owner) being reviewed', required: false })
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  collectorId: Types.ObjectId;

  @ApiProperty({ description: 'Logement ID', required: false })
  @Prop({ type: String, required: false }) // String car peut être un ID d'annonce ou autre
  logementId: string;

  @ApiProperty({ description: 'Collector Rating', required: false })
  @Prop({ required: false })
  collectorRating: number;

  @ApiProperty({ description: 'Cleanliness Rating', required: false })
  @Prop({ required: false })
  cleanlinessRating: number;

  @ApiProperty({ description: 'Location Rating', required: false })
  @Prop({ required: false })
  locationRating: number;

  @ApiProperty({ description: 'Conformity Rating', required: false })
  @Prop({ required: false })
  conformityRating: number;

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
export type ReviewDocument = Review & Document;