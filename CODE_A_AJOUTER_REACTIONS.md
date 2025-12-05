# Code à ajouter au backend pour les réactions

## 1. Dans chat.service.ts - Ajouter cette méthode à la fin de la classe ChatService

```typescript
  /**
   * Ajouter ou retirer une réaction à un message
   * Si l'utilisateur a déjà réagi avec cet emoji, la réaction est retirée
   */
  async toggleReaction(messageId: string, emoji: string, userId: string): Promise<any> {
    const message = await this.messageModel.findById(messageId).exec();
    
    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    // Initialiser reactions si undefined
    if (!message.reactions) {
      message.reactions = {};
    }

    // Vérifier si l'utilisateur a déjà réagi avec cet emoji
    const currentReactions = message.reactions[emoji] || [];
    const userIndex = currentReactions.indexOf(userId);

    if (userIndex > -1) {
      // L'utilisateur a déjà réagi, retirer la réaction
      currentReactions.splice(userIndex, 1);
      if (currentReactions.length === 0) {
        // Si plus personne n'a cette réaction, supprimer l'emoji
        delete message.reactions[emoji];
      } else {
        message.reactions[emoji] = currentReactions;
      }
    } else {
      // Ajouter la réaction de l'utilisateur
      message.reactions[emoji] = [...currentReactions, userId];
    }

    // Marquer reactions comme modifié pour Mongoose
    message.markModified('reactions');
    await message.save();

    console.log(`[ChatService] ✅ Réaction ${emoji} toggleée pour le message ${messageId} par ${userId}`);
    return this.enrichMessage(message);
  }
```

## 2. Dans chat.controller.ts - Ajouter cet endpoint

```typescript
  @Post('message/:messageId/reaction')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Ajouter ou retirer une réaction à un message' })
  @ApiParam({ name: 'messageId', description: 'ID du message' })
  @ApiResponse({ status: 200, description: 'Réaction ajoutée/retirée avec succès' })
  @ApiResponse({ status: 404, description: 'Message non trouvé' })
  async toggleReaction(
    @Param('messageId') messageId: string,
    @Body() toggleReactionDto: { emoji: string },
    @CurrentUser() user: any,
  ) {
    return this.chatService.toggleReaction(messageId, toggleReactionDto.emoji, user.userId);
  }
```

## 3. Dans chat.gateway.ts - Ajouter ce gestionnaire d'événement

```typescript
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

      // Toggle la réaction via le service
      const updatedMessage = await this.chatService.toggleReaction(data.messageId, data.emoji, userId);

      // Notifier tous les utilisateurs de la visite que les réactions ont changé
      this.server.to(`visite:${updatedMessage.visiteId}`).emit('reaction_updated', {
        messageId: data.messageId,
        reactions: updatedMessage.reactions,
      });

      // Notifier aussi le destinataire directement
      this.server.to(`user:${updatedMessage.receiverId}`).emit('reaction_updated', {
        messageId: data.messageId,
        reactions: updatedMessage.reactions,
      });

      // Notifier aussi l'expéditeur
      this.server.to(`user:${updatedMessage.senderId}`).emit('reaction_updated', {
        messageId: data.messageId,
        reactions: updatedMessage.reactions,
      });

      console.log(`[ChatGateway] Reaction ${data.emoji} toggled for message ${data.messageId} by user ${userId}`);
      return updatedMessage;
    } catch (error: any) {
      console.error('[ChatGateway] Error toggling reaction:', error);
      client.emit('error', { message: error.message || 'Erreur lors de l\'ajout de la réaction' });
    }
  }
```

## Instructions d'ajout

1. Ouvrez `chat.service.ts` et ajoutez la méthode `toggleReaction` avant la dernière accolade de la classe
2. Ouvrez `chat.controller.ts` et ajoutez l'endpoint `toggleReaction` avant la dernière accolade de la classe
3. Ouvrez `chat.gateway.ts` et ajoutez le gestionnaire `handleToggleReaction` avant la dernière accolade de la classe

## Vérification

Après avoir ajouté le code, redémarrez le backend :
```bash
npm run start:dev
```

Vérifiez dans Swagger : `http://localhost:3009/api`
Vous devriez voir le nouvel endpoint `POST /chat/message/{messageId}/reaction`
