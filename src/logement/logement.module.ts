import { Module } from '@nestjs/common';
import { LogementService } from './logement.service';
import { LogementController } from './logement.controller';

@Module({
  controllers: [LogementController],
  providers: [LogementService],
})
export class LogementModule {}
