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
  ) { }

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

  // Nouveaux gestionnaires d'événements pour suppression, modification et statuts

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.connectedUsers.get(client.id);
      if (!userId) {
        client.emit('error', { message: 'Non autorisé' });
        return;
      }

      // Supprimer le message via le service
      const deletedMessage = await this.chatService.deleteMessage(data.messageId, userId);

      // Notifier tous les utilisateurs de la visite que le message a été supprimé
      this.server.to(`visite:${deletedMessage.visiteId}`).emit('message_deleted', {
        messageId: data.messageId,
        visiteId: deletedMessage.visiteId,
      });

      // Notifier aussi le destinataire directement
      this.server.to(`user:${deletedMessage.receiverId}`).emit('message_deleted', {
        messageId: data.messageId,
        visiteId: deletedMessage.visiteId,
      });

      console.log(`[ChatGateway] Message ${data.messageId} deleted by user ${userId}`);
      return deletedMessage;
    } catch (error: any) {
      console.error('[ChatGateway] Error deleting message:', error);
      client.emit('error', { message: error.message || 'Erreur lors de la suppression du message' });
    }
  }

  @SubscribeMessage('update_message')
  async handleUpdateMessage(
    @MessageBody() data: { messageId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.connectedUsers.get(client.id);
      if (!userId) {
        client.emit('error', { message: 'Non autorisé' });
        return;
      }

      // Modifier le message via le service
      const updatedMessage = await this.chatService.updateMessage(data.messageId, data.content, userId);

      // Notifier tous les utilisateurs de la visite que le message a été modifié
      this.server.to(`visite:${updatedMessage.visiteId}`).emit('message_updated', updatedMessage);

      // Notifier aussi le destinataire directement
      this.server.to(`user:${updatedMessage.receiverId}`).emit('message_updated', updatedMessage);

      console.log(`[ChatGateway] Message ${data.messageId} updated by user ${userId}`);
      return updatedMessage;
    } catch (error: any) {
      console.error('[ChatGateway] Error updating message:', error);
      client.emit('error', { message: error.message || 'Erreur lors de la modification du message' });
    }
  }

  @SubscribeMessage('update_message_status')
  async handleUpdateMessageStatus(
    @MessageBody() data: { messageId: string; status: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.connectedUsers.get(client.id);
      if (!userId) {
        client.emit('error', { message: 'Non autorisé' });
        return;
      }

      // Mettre à jour le statut via le service
      const updatedMessage = await this.chatService.updateMessageStatus(data.messageId, data.status, userId);

      // Notifier l'expéditeur du message que le statut a changé
      this.server.to(`user:${updatedMessage.senderId}`).emit('message_status_changed', {
        messageId: data.messageId,
        status: data.status,
        deliveredAt: updatedMessage.deliveredAt,
        readAt: updatedMessage.readAt,
      });

      console.log(`[ChatGateway] Message ${data.messageId} status updated to "${data.status}" by user ${userId}`);
      return updatedMessage;
    } catch (error: any) {
      console.error('[ChatGateway] Error updating message status:', error);
      client.emit('error', { message: error.message || 'Erreur lors de la mise à jour du statut' });
    }
  }

  @SubscribeMessage('toggle_reaction')
  async handleToggleReaction(
    @MessageBody() data: { messageId: string; emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = this.connectedUsers.get(client.id);
      if (!userId) {
        client.emit('error', { message: 'Non autorisé' });
        return;
      }

      const updatedMessage = await this.chatService.toggleReaction(data.messageId, data.emoji, userId);

      this.server.to(`visite:${updatedMessage.visiteId}`).emit('reaction_updated', {
        messageId: data.messageId,
        reactions: updatedMessage.reactions,
      });

      this.server.to(`user:${updatedMessage.receiverId}`).emit('reaction_updated', {
        messageId: data.messageId,
        reactions: updatedMessage.reactions,
      });

      this.server.to(`user:${updatedMessage.senderId}`).emit('reaction_updated', {
        messageId: data.messageId,
        reactions: updatedMessage.reactions,
      });

      console.log(`[ChatGateway] Reaction ${data.emoji} toggled for ${data.messageId}`);
      return updatedMessage;
    } catch (error: any) {
      console.error('[ChatGateway] Error toggling reaction:', error);
      client.emit('error', { message: error.message });
    }
  }
}

