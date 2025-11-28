import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Report extends Document {
  @ApiProperty()
  @Prop({ required: true })
  reason: string;

  @ApiProperty()
  @Prop({ required: true })
  details: string;

  @ApiProperty({ description: 'User who submitted the report' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
