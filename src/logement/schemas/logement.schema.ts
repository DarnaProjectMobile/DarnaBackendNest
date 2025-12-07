import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LogementDocument = HydratedDocument<Logement>;

@Schema({ timestamps: true })
export class Logement {
  @Prop({ required: true, type: String, unique: true })
  annonceId: string; // ID de l'annonce (nom de l'annonce = id du logement)

  @Prop({ required: true, type: String })
  ownerId: string; // ID du colocataire propriétaire

  @Prop({ required: true })
  title: string; // Titre du logement

  @Prop({ required: false })
  description?: string; // Description du logement

  @Prop({ required: true })
  address: string; // Adresse du logement

  @Prop({ required: true, type: Number })
  price: number; // Prix du logement

  @Prop({ required: false, type: [String], default: [] })
  images?: string[]; // Images du logement

  @Prop({ required: false, type: Number })
  rooms?: number; // Nombre de chambres

  @Prop({ required: false, type: Number })
  surface?: number; // Surface en m²

  @Prop({ default: true })
  available: boolean; // Disponibilité du logement

  @Prop({ type: Object, required: false })
  location?: {
    latitude: number;
    longitude: number;
  }; // Coordonnées GPS
}

export const LogementSchema = SchemaFactory.createForClass(Logement);









