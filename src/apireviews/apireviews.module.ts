import { Module } from '@nestjs/common';
import { ApireviewsService } from './apireviews.service';
import { ApireviewsController } from './apireviews.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Apireview, ApireviewSchema } from './entities/apireview.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Apireview.name, schema: ApireviewSchema }]),
  ],
  controllers: [ApireviewsController],
  providers: [ApireviewsService],
})
export class ApireviewsModule {}
