import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VisiteService } from './visite.service';
import { VisiteController } from './visite.controller';
import { Visite, VisiteSchema } from './entities/visite.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Visite.name, schema: VisiteSchema }]),
  ],
  controllers: [VisiteController],
  providers: [VisiteService],
  exports: [VisiteService],
})
export class VisiteModule {}
