import {
  IsString,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  IsMongoId,
  IsNumber
} from 'class-validator';

export class CreatePubliciteDto {
  @IsString()
  @IsNotEmpty()
  titre: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  // ✅ "type" est obligatoire dans ton schéma
  @IsString()
  @IsNotEmpty()
  type: string;

  // ✅ optionnel : pourcentage de réduction
  @IsOptional()
  @IsNumber()
  pourcentageReduction?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  // ✅ optionnel car ton service set déjà une dateDebut par défaut
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string;

  // ✅ Injecté automatiquement depuis le JWT (sponsor connecté)
  @IsOptional()
  @IsMongoId()
  partenaireId?: string;
}
