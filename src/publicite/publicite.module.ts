import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PubliciteService } from './publicite.service';
import { PubliciteController } from './publicite.controller';
import { Publicite, PubliciteSchema } from './schemas/publicite.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Publicite.name, schema: PubliciteSchema }]),
  ],
  controllers: [PubliciteController],
  providers: [PubliciteService],
  exports: [PubliciteService],
})
export class PubliciteModule {}

