import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { cloudinaryProvider } from './cloudinary.config';
import { CloudinaryController } from './cloudinary.controller';

/**
 * Cloudinary Module
 * Provides image upload functionality using Cloudinary
 * No local disk storage - all images stored in the cloud
 */
@Module({
  providers: [cloudinaryProvider, CloudinaryService],
  controllers: [CloudinaryController],
  exports: [CloudinaryService, 'CLOUDINARY'],
})
export class CloudinaryModule {}
