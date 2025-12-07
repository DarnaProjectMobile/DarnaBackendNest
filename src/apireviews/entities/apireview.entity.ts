import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApireviewDocument = Apireview & Document;

@Schema()
export class Apireview {
  @Prop({ required: true })
  propertyId: string;

  @Prop({ required: true })
  authorId: string;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  sentimentLabel: string;

  @Prop({ required: true })
  sentimentScore: number;

  @Prop({ required: true })
  summary: string;

  @Prop({ required: true })
  landlordRiskLevel: string;

  @Prop({ required: true })
  satisfactionScore: number;

  @Prop({ required: true })
  safetyScore: number;

  @Prop({ required: true })
  isToxic: boolean;

  @Prop({ required: true })
  toxicityLevel: string;

  @Prop({ required: true })
  shouldBlock: boolean;

  @Prop()
  suggestedRephrase: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ApireviewSchema = SchemaFactory.createForClass(Apireview);
