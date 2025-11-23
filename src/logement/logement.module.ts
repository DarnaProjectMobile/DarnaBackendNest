import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LogementService } from './logement.service';
import { LogementController } from './logement.controller';
import { Logement, LogementSchema } from './schemas/logement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Logement.name, schema: LogementSchema }]),
  ],
  controllers: [LogementController],
  providers: [LogementService],
  exports: [LogementService],
})
export class LogementModule {}









