import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET') || 'yourSecretKey';
      const payload = this.jwtService.verify(token, { secret });
      const userId = payload.userId || payload.sub;
      
      if (!userId) {
        client.disconnect();
        return;
      }

      this.connectedUsers.set(client.id, userId);
      client.join(`user:${userId}`);
      
      console.log(`[ChatGateway] User ${userId} connected (socket: ${client.id})`);
    } catch (error) {
      console.error('[ChatGateway] Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);
      console.log(`[ChatGateway] User ${userId} disconnected (socket: ${client.id})`);
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: CreateMessageDto & { senderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.connectedUsers.get(client.id);
      if (!userId || userId !== data.senderId) {
        client.emit('error', { message: 'Non autorisé' });
        return;
      }

      // Créer le message dans la base de données
      const message = await this.chatService.createMessage(
        { visiteId: data.visiteId, content: data.content },
        userId,
      );

      // Envoyer le message au destinataire
      this.server.to(`user:${message.receiverId}`).emit('new_message', message);
      
      // Confirmer l'envoi à l'expéditeur
      client.emit('message_sent', message);

      return message;
    } catch (error: any) {
      console.error('[ChatGateway] Error sending message:', error);
      client.emit('error', { message: error.message || 'Erreur lors de l\'envoi du message' });
    }
  }

  @SubscribeMessage('join_visite')
  async handleJoinVisite(
    @MessageBody() data: { visiteId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      client.join(`visite:${data.visiteId}`);
      console.log(`[ChatGateway] User ${userId} joined visite ${data.visiteId}`);
    }
  }

  @SubscribeMessage('leave_visite')
  async handleLeaveVisite(
    @MessageBody() data: { visiteId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      client.leave(`visite:${data.visiteId}`);
      console.log(`[ChatGateway] User ${userId} left visite ${data.visiteId}`);
    }
  }
}

