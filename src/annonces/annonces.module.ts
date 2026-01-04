import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnnoncesService } from './annonces.service';
import { AnnoncesController } from './annonces.controller';
import { Annonce, AnnonceSchema } from './entities/annonce.entity';
import { UsersModule } from 'src/users/users.module';
import { NotificationModule } from 'src/notification/notification.module';
import { ImageVerificationService } from './image-verification.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Annonce.name, schema: AnnonceSchema }]),
    UsersModule,
    NotificationModule,
  ],
  controllers: [AnnoncesController],
  providers: [AnnoncesService, ImageVerificationService],
})
export class AnnoncesModule {}