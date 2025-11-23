import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnnoncesService } from './annonces.service';
import { AnnoncesController } from './annonces.controller';
import { Annonce, AnnonceSchema } from './schemas/annonce.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Annonce.name, schema: AnnonceSchema }]),
  ],
  controllers: [AnnoncesController],
  providers: [AnnoncesService],
  exports: [AnnoncesService],
})
export class AnnoncesModule {}

