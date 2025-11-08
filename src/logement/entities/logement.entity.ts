import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LogementDocument = HydratedDocument<Logement>;

@Schema({ timestamps: true })
export class Logement {
  @Prop({ required: true, type: String })
  ownerId: string; // Référence au propriétaire

  @Prop({ required: true })
  title: string; // Titre du logement

  @Prop({ required: true })
  description: string; // Description du logement

  @Prop({ required: true })
  address: string; // Adresse

  @Prop({ required: true })
  city: string; // Ville

  @Prop({ required: true })
  price: number; // Prix

  @Prop({ required: true })
  surface: number; // Surface en m²

  @Prop({ required: true })
  rooms: number; // Nombre de pièces

  @Prop({ required: false, type: [String], default: [] })
  images?: string[]; // Tableau d'URLs d'images

  @Prop({ required: false, default: true })
  available: boolean; // Disponibilité

  @Prop({ required: false })
  type?: string; // Type: 'appartement', 'maison', 'studio', etc.

  @Prop({ required: false, type: Object })
  location?: {
    latitude: number;
    longitude: number;
  }; // Coordonnées GPS

  @Prop({ required: false, type: [String], default: [] })
  amenities?: string[]; // Équipements: ['wifi', 'parking', 'climatisation', etc.]
}

export const LogementSchema = SchemaFactory.createForClass(Logement);
