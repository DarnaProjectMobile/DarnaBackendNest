import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Publicite, PubliciteSchema } from './entities/publicite.entity';
import { PubliciteService } from './publicite.service';
import { PubliciteController } from './publicite.controller';
import { QrCodeModule } from '../qrcode/qrcode.module';
import { User, UserSchema } from 'src/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicite.name, schema: PubliciteSchema },
      { name: User.name, schema: UserSchema },
    ]),
    QrCodeModule,
  ],
  providers: [PubliciteService],
  controllers: [PubliciteController],
})
export class PubliciteModule {}
