import { Module } from '@nestjs/common';
import { PubliciteService } from './publicite.service';
import { PubliciteController } from './publicite.controller';

@Module({
  controllers: [PubliciteController],
  providers: [PubliciteService],
})
export class PubliciteModule {}
