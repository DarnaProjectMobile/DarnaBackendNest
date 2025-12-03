import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';

export type PubliciteDocument = HydratedDocument<Publicite>;

export enum PubliciteType {
  REDUCTION = 'reduction',
  PROMOTION = 'promotion',
  JEU = 'jeu',
}

@Schema({ timestamps: true })
export class Publicite {
  _id: Types.ObjectId;

  @ApiProperty({ description: 'Titre de la publicité', example: 'Promotion rentrée universitaire' })
  @Prop({ required: true })
  titre: string;

  @ApiProperty({ description: 'Description de la publicité', example: 'Réduction de 20% sur les fournitures scolaires' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: 'URL de l\'image de la publicité', example: 'https://exemple.com/image.jpg' })
  @Prop({ required: true })
  image: string;

  @ApiProperty({ description: 'Type de publicité', enum: PubliciteType, example: PubliciteType.REDUCTION })
  @Prop({
    type: String,
    enum: PubliciteType,
    required: true,
  })
  type: PubliciteType;

  @ApiProperty({ required: false })
  @Prop()
  details?: string;

  @ApiProperty({ required: false })
  @Prop({ required: false })
  coupon?: string;

  @ApiProperty({ required: false })
  @Prop({ type: String, required: false })
  qrCode?: string; // base64 image

  @ApiProperty({ enum: ['EN_ATTENTE', 'PUBLIEE', 'REJETEE'], default: 'EN_ATTENTE' })
  @Prop({
    type: String,
    enum: ['EN_ATTENTE', 'PUBLIEE', 'REJETEE'],
    default: 'EN_ATTENTE',
  })
  statut?: string;

  @ApiProperty({ required: false })
  @Prop()
  paymentDate?: Date;

  @ApiProperty({ required: false })
  @Prop()
  categorie?: string;

  @ApiProperty({ required: false })
  @Prop()
  dateExpiration?: string;

  @ApiProperty({ required: false })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  detailReduction?: {
    pourcentage: number;
    conditionsUtilisation: string;
  };

  @ApiProperty({ required: false })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  detailPromotion?: {
    offre: string;
    conditions: string;
  };

  @ApiProperty({ required: false })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  detailJeu?: {
    description: string;
    gains: string[];
  };

  @ApiProperty({ description: 'Sponsor (User) who created the publicité' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sponsor: Types.ObjectId;
}

export const PubliciteSchema = SchemaFactory.createForClass(Publicite);
