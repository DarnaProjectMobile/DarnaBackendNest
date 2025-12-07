import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { Message, MessageSchema } from './schemas/message.schema';
import { VisiteModule } from '../visite/visite.module';
import { UsersModule } from '../users/users.module';
import { LogementModule } from '../logement/logement.module';
import { NotificationsFirebaseModule } from '../notifications-firebase/notifications-firebase.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    VisiteModule,
    UsersModule,
    LogementModule,
    NotificationsFirebaseModule,
    JwtModule,
    ConfigModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}

