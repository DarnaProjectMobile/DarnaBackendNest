import { Module } from '@nestjs/common';
import { VisiteService } from './visite.service';
import { VisiteController } from './visite.controller';

@Module({
  controllers: [VisiteController],
  providers: [VisiteService],
})
export class VisiteModule {}
