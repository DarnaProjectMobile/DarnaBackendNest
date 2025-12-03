import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { VisiteService } from '../visite/visite.service';
import { UsersService } from '../users/users.service';
import { LogementService } from '../logement/logement.service';
import { Logement } from '../logement/schemas/logement.schema';
import { NotificationsFirebaseService } from '../notifications-firebase/notifications-firebase.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private visiteService: VisiteService,
    private usersService: UsersService,
    private logementService: LogementService,
    private notificationsFirebaseService: NotificationsFirebaseService,
  ) {}

  async createMessage(createMessageDto: CreateMessageDto, senderId: string): Promise<any> {
    // Vérifier que la visite existe et est acceptée
    const visite = await this.visiteService.findOneRaw(createMessageDto.visiteId);
    
    if (!visite) {
      throw new NotFoundException('Visite non trouvée');
    }

    // Vérifier que la visite est acceptée (confirmed)
    if (visite.status !== 'confirmed') {
      throw new ForbiddenException('Le chat n\'est disponible que pour les visites acceptées. Statut actuel: ' + visite.status);
    }

    // Déterminer le receiverId (l'autre partie)
    const collectorId = await this.getCollectorIdFromVisite(createMessageDto.visiteId);
    
    // Normaliser les IDs en string pour éviter les problèmes de comparaison (ObjectId vs string)
    const normalizedVisiteUserId = String(visite.userId || '').trim();
    const normalizedSenderId = String(senderId || '').trim();
    const normalizedCollectorId = collectorId ? String(collectorId).trim() : null;
    
    console.log(`[ChatService] ========== DEBUG createMessage ==========`);
    console.log(`[ChatService] senderId (raw): ${senderId}, (normalized): ${normalizedSenderId}`);
    console.log(`[ChatService] visite.userId (raw): ${visite.userId}, (normalized): ${normalizedVisiteUserId}`);
    console.log(`[ChatService] collectorId (raw): ${collectorId}, (normalized): ${normalizedCollectorId}`);
    console.log(`[ChatService] Comparaison directe: ${normalizedVisiteUserId} === ${normalizedSenderId} ? ${normalizedVisiteUserId === normalizedSenderId}`);
    console.log(`[ChatService] Type senderId: ${typeof senderId}, Type visite.userId: ${typeof visite.userId}`);
    
    // Vérifier que l'utilisateur est bien le client ou le colocataire
    const isClient = normalizedVisiteUserId === normalizedSenderId;
    const isCollector = normalizedCollectorId !== null && normalizedCollectorId !== 'default-owner-id' && normalizedCollectorId === normalizedSenderId;
    
    console.log(`[ChatService] isClient: ${isClient}, isCollector: ${isCollector}`);
    
    // Vérifier si l'utilisateur a déjà envoyé ou reçu des messages dans cette visite
    const existingMessage = await this.messageModel.findOne({
      visiteId: createMessageDto.visiteId,
      $or: [
        { senderId: normalizedSenderId },
        { receiverId: normalizedSenderId }
      ]
    }).sort({ createdAt: -1 }).exec();
    
    let isInvolvedInConversation = false;
    let existingReceiverId: string | null = null;
    
    if (existingMessage) {
      isInvolvedInConversation = true;
      // Déterminer le receiverId basé sur le message existant
      const existingSenderId = String(existingMessage.senderId).trim();
      const existingReceiverIdRaw = String(existingMessage.receiverId).trim();
      if (existingSenderId === normalizedSenderId) {
        existingReceiverId = existingReceiverIdRaw;
      } else {
        existingReceiverId = existingSenderId;
      }
      console.log(`[ChatService] ✅ Utilisateur impliqué dans la conversation, receiverId: ${existingReceiverId}`);
    }
    
    // SIMPLIFICATION: Si la comparaison directe échoue, essayer une comparaison plus flexible
    let isClientFlexible = isClient;
    if (!isClient) {
      // Essayer plusieurs méthodes de comparaison
      const visiteUserIdStr = String(visite.userId || '').trim();
      const senderIdStr = String(senderId || '').trim();
      
      // Comparaison directe après trim
      isClientFlexible = visiteUserIdStr === senderIdStr;
      
      // Si toujours pas, essayer sans espaces
      if (!isClientFlexible) {
        isClientFlexible = visiteUserIdStr.replace(/\s/g, '') === senderIdStr.replace(/\s/g, '');
      }
      
      // Si toujours pas, essayer de comparer les valeurs brutes converties en string
      if (!isClientFlexible) {
        const rawVisiteUserId = String(visite.userId);
        const rawSenderId = String(senderId);
        isClientFlexible = rawVisiteUserId === rawSenderId || 
                          rawVisiteUserId.trim() === rawSenderId.trim();
      }
      
      if (isClientFlexible && !isClient) {
        console.log(`[ChatService] ⚠️ Comparaison flexible réussie: visite.userId="${visiteUserIdStr}" === senderId="${senderIdStr}"`);
      }
    }
    
    // Si l'utilisateur est le client (même avec comparaison flexible) OU a déjà envoyé des messages, TOUJOURS autoriser
    let isAuthorized = isClientFlexible || isCollector || isInvolvedInConversation;
    
    // Dernière chance: si la visite est confirmée et que l'utilisateur n'est pas le collector,
    // on assume que c'est le client (même si la comparaison d'IDs a échoué)
    if (!isAuthorized && visite.status === 'confirmed' && !isCollector) {
      console.log(`[ChatService] ⚠️ Comparaison stricte échouée mais visite confirmée - Autorisation conditionnelle (assume client)`);
      isClientFlexible = true;
      isAuthorized = true;
    }
    
    if (isClientFlexible) {
      console.log(`[ChatService] ✅ CLIENT DÉTECTÉ - Autorisation automatique accordée`);
    } else if (isInvolvedInConversation) {
      console.log(`[ChatService] ✅ PARTICIPANT DÉTECTÉ (a déjà envoyé/reçu des messages) - Autorisation accordée`);
    } else if (!isAuthorized) {
      console.error(`[ChatService] ❌ Accès refusé - senderId: ${normalizedSenderId} n'est ni le client (${normalizedVisiteUserId}) ni le colocataire (${normalizedCollectorId}) ni impliqué dans la conversation`);
      throw new ForbiddenException(`Vous n'êtes pas autorisé à envoyer des messages pour cette visite. Client: ${normalizedVisiteUserId}, Colocataire: ${normalizedCollectorId || 'non trouvé'}`);
    }
    
    let receiverId: string | null = null;
    if (isClientFlexible) {
      // L'utilisateur est le client, le destinataire est le colocataire
      console.log(`[ChatService] 🔍 Recherche du receiverId pour le client...`);
      
      if (normalizedCollectorId && normalizedCollectorId !== 'default-owner-id') {
        receiverId = normalizedCollectorId;
        console.log(`[ChatService] ✅ Client envoie au colocataire (collectorId valide): ${receiverId}`);
      } else {
        // Si collectorId est "default-owner-id" ou null, chercher le receiverId dans les messages existants
        console.log(`[ChatService] 🔍 CollectorId invalide, recherche dans les messages existants...`);
        const existingMessage = await this.messageModel.findOne({
          visiteId: createMessageDto.visiteId,
          senderId: { $ne: normalizedSenderId } // Message envoyé par quelqu'un d'autre
        }).sort({ createdAt: -1 }).exec();
        
        if (existingMessage) {
          // Utiliser le senderId du message existant comme receiverId
          receiverId = String(existingMessage.senderId).trim();
          console.log(`[ChatService] ✅ ReceiverId trouvé depuis les messages existants: ${receiverId}`);
        } else {
          // Chercher dans tous les messages de la visite pour trouver l'autre participant
          const allMessages = await this.messageModel.find({
            visiteId: createMessageDto.visiteId
          }).exec();
          
          if (allMessages.length > 0) {
            // Trouver un receiverId qui n'est pas le senderId actuel
            const otherParticipant = allMessages.find(msg => {
              const msgSenderId = String(msg.senderId).trim();
              const msgReceiverId = String(msg.receiverId).trim();
              return msgSenderId !== normalizedSenderId && msgReceiverId !== normalizedSenderId;
            });
            if (otherParticipant) {
              const otherSenderId = String(otherParticipant.senderId).trim();
              receiverId = otherSenderId === normalizedSenderId ? String(otherParticipant.receiverId).trim() : otherSenderId;
              console.log(`[ChatService] ✅ ReceiverId trouvé depuis tous les messages: ${receiverId}`);
            }
          }
          
          // Si toujours pas de receiverId trouvé, chercher via le logement
          if (!receiverId && visite.logementId) {
            try {
              let logement: Logement | null = null;
              try {
                if (Types.ObjectId.isValid(visite.logementId) && new Types.ObjectId(visite.logementId).toString() === visite.logementId) {
                  logement = await this.logementService.findOne(visite.logementId);
                } else {
                  logement = await this.logementService.findByAnnonceId(visite.logementId);
                }
              } catch (e) {
                console.warn(`[ChatService] Erreur récupération logement pour receiverId: ${e}`);
              }
              
              if (logement && logement.ownerId && logement.ownerId !== 'default-owner-id') {
                receiverId = String(logement.ownerId).trim();
                console.log(`[ChatService] ✅ ReceiverId trouvé via le logement (ownerId): ${receiverId}`);
              }
            } catch (e) {
              console.warn(`[ChatService] Erreur recherche receiverId via logement: ${e}`);
            }
          }
          
          // Si toujours pas de receiverId trouvé, utiliser collectorId même s'il est "default-owner-id"
          // Cela permettra au message d'être créé et quand le vrai colocataire répondra, on pourra l'identifier
          if (!receiverId) {
            receiverId = normalizedCollectorId || 'default-owner-id';
            console.log(`[ChatService] ⚠️ Premier message ou aucun message trouvé, utilisation de collectorId (peut être default-owner-id): ${receiverId}`);
          }
        }
      }
      console.log(`[ChatService] ✅ Client envoie au colocataire: ${receiverId}`);
    } else if (isCollector) {
      // L'utilisateur est le colocataire, le destinataire est le client
      receiverId = normalizedVisiteUserId;
      console.log(`[ChatService] ✅ Colocataire envoie au client: ${receiverId}`);
    } else if (isInvolvedInConversation && existingReceiverId) {
      // L'utilisateur est impliqué dans la conversation, utiliser le receiverId du message existant
      receiverId = String(existingReceiverId).trim();
      console.log(`[ChatService] ✅ Participant envoie à: ${receiverId}`);
    }

    // Ne pas rejeter si receiverId est "default-owner-id" - cela permet au premier message d'être envoyé
    if (!receiverId || receiverId.trim() === '') {
      console.error(`[ChatService] ❌ Impossible de déterminer le destinataire. senderId: ${normalizedSenderId}, visite.userId: ${normalizedVisiteUserId}, collectorId: ${normalizedCollectorId}`);
      throw new ForbiddenException(`Vous n'êtes pas autorisé à envoyer des messages pour cette visite. Client: ${normalizedVisiteUserId}, Colocataire: ${normalizedCollectorId || 'non trouvé'}`);
    }
    
    console.log(`[ChatService] ✅ Autorisation OK - ${isClient ? 'Client' : (isCollector ? 'Colocataire' : 'Participant')} peut envoyer`);
    console.log(`[ChatService] ========== FIN DEBUG ==========`);

    // Déterminer le type de message
    const hasContent = createMessageDto.content && createMessageDto.content.trim().length > 0;
    const hasImages = createMessageDto.images && createMessageDto.images.length > 0;
    
    if (!hasContent && !hasImages) {
      throw new ForbiddenException('Le message doit contenir du texte ou des images');
    }

    const messageType = hasContent && hasImages ? 'text_image' : (hasImages ? 'image' : 'text');

    const message = new this.messageModel({
      visiteId: createMessageDto.visiteId,
      senderId,
      receiverId,
      content: createMessageDto.content || '',
      images: createMessageDto.images || [],
      type: messageType,
      read: false,
    });

    const savedMessage = await message.save();
    console.log(`[ChatService] Message créé avec succès: ${savedMessage._id}, senderId: ${senderId}, receiverId: ${receiverId}`);
    
    const enrichedMessage = await this.enrichMessage(savedMessage);

    // Envoyer une notification Firebase au destinataire
    try {
      const visite = await this.visiteService.findOneRaw(createMessageDto.visiteId);
      const sender = await this.usersService.findById(senderId);
      
      // PRIORITÉ: Chercher le vrai receiverId pour la notification
      // On utilise receiverId comme point de départ, mais on cherche toujours le vrai collector
      let actualReceiverId = receiverId;
      
      // Si receiverId est "default-owner-id" ou si on veut s'assurer d'avoir le bon receiverId,
      // chercher le collector via le logement (méthode la plus fiable)
      if ((receiverId === 'default-owner-id' || !receiverId) && visite?.logementId) {
        console.log(`[ChatService] 🔍 Recherche du collector via le logement pour la notification...`);
        try {
          let logementForNotif: Logement | null = null;
          try {
            if (Types.ObjectId.isValid(visite.logementId) && new Types.ObjectId(visite.logementId).toString() === visite.logementId) {
              logementForNotif = await this.logementService.findOne(visite.logementId);
            } else {
              logementForNotif = await this.logementService.findByAnnonceId(visite.logementId);
            }
          } catch (e) {
            console.warn(`[ChatService] Erreur récupération logement pour notification: ${e}`);
          }
          
          if (logementForNotif && logementForNotif.ownerId) {
            const ownerIdStr = String(logementForNotif.ownerId).trim();
            // Utiliser ownerId même s'il est "default-owner-id" (mieux que rien)
            actualReceiverId = ownerIdStr;
            console.log(`[ChatService] ✅ ReceiverId trouvé via le logement (ownerId): ${actualReceiverId}`);
          }
        } catch (e) {
          console.warn(`[ChatService] Erreur recherche collector via logement: ${e}`);
        }
      }
      
      // Si toujours "default-owner-id", chercher dans les messages existants
      if (actualReceiverId === 'default-owner-id') {
        console.log(`[ChatService] ⚠️ receiverId est toujours "default-owner-id", recherche dans les messages...`);
        
        // 1. Chercher dans TOUS les messages de la visite pour trouver l'autre participant
        const allMessages = await this.messageModel.find({
          visiteId: createMessageDto.visiteId
        }).exec();
        
        if (allMessages.length > 0) {
          // Trouver l'autre participant (celui qui n'est pas le sender actuel)
          for (const msg of allMessages) {
            const msgSenderId = String(msg.senderId).trim();
            const msgReceiverId = String(msg.receiverId).trim();
            
            // Si le sender du message n'est pas le sender actuel, c'est probablement le collector
            if (msgSenderId !== normalizedSenderId) {
              actualReceiverId = msgSenderId;
              console.log(`[ChatService] ✅ ReceiverId trouvé (sender d'un message existant): ${actualReceiverId}`);
              break;
            }
            // Sinon, si le receiver du message n'est pas le sender actuel, c'est probablement le collector
            if (msgReceiverId !== normalizedSenderId) {
              actualReceiverId = msgReceiverId;
              console.log(`[ChatService] ✅ ReceiverId trouvé (receiver d'un message existant): ${actualReceiverId}`);
              break;
            }
          }
        }
        
        // 2. Si toujours pas trouvé, chercher un message où le client a reçu (le sender est le collector)
        if (actualReceiverId === 'default-owner-id') {
          const collectorMessage = await this.messageModel.findOne({
            visiteId: createMessageDto.visiteId,
            receiverId: normalizedVisiteUserId, // Le client a reçu
            senderId: { $ne: normalizedSenderId } // De quelqu'un d'autre (le collector)
          }).sort({ createdAt: -1 }).exec();
          
          if (collectorMessage) {
            actualReceiverId = String(collectorMessage.senderId).trim();
            console.log(`[ChatService] ✅ ReceiverId trouvé (collector qui a envoyé au client): ${actualReceiverId}`);
          }
        }
      }
      
      // Récupérer le logement avec la même logique que getCollectorIdFromVisite
      let logement: Logement | null = null;
      if (visite?.logementId) {
        try {
          if (Types.ObjectId.isValid(visite.logementId) && new Types.ObjectId(visite.logementId).toString() === visite.logementId) {
            logement = await this.logementService.findOne(visite.logementId);
          } else {
            logement = await this.logementService.findByAnnonceId(visite.logementId);
          }
        } catch (e: any) {
          console.warn(`[ChatService] Impossible de récupérer le logement pour la notification: ${e.message}`);
        }
      }
      
      // Vérification finale: Si actualReceiverId est toujours "default-owner-id", utiliser le logement
      if (actualReceiverId === 'default-owner-id' && logement && logement.ownerId) {
        const ownerIdStr = String(logement.ownerId).trim();
        // Utiliser ownerId même s'il est "default-owner-id" (on essaiera quand même d'envoyer)
        actualReceiverId = ownerIdStr;
        console.log(`[ChatService] ✅ ReceiverId final utilisé depuis logement: ${actualReceiverId}`);
      }
      
      // ENVOYER LA NOTIFICATION - Toujours essayer, même si actualReceiverId est "default-owner-id"
      // Le service de notification gérera le cas où l'utilisateur n'existe pas ou n'a pas de token
      if (actualReceiverId) {
        console.log(`[ChatService] ========== ENVOI NOTIFICATION ==========`);
        console.log(`[ChatService] 📧 receiverId original (dans message): ${receiverId}`);
        console.log(`[ChatService] 📧 actualReceiverId (pour notification): ${actualReceiverId}`);
        console.log(`[ChatService] 📧 senderId: ${senderId}, senderName: ${sender?.username || 'N/A'}`);
        console.log(`[ChatService] 📧 visitId: ${createMessageDto.visiteId}, housingId: ${visite?.logementId}`);
        
        try {
          await this.notificationsFirebaseService.notifyNewMessage({
            userId: actualReceiverId,
            visitId: createMessageDto.visiteId,
            housingId: visite?.logementId,
            housingTitle: logement?.title || visite?.logementId || 'Logement',
            senderName: sender?.username || 'Quelqu\'un',
            messageContent: createMessageDto.content || (hasImages ? '📷 Image' : 'Message'),
            hasImages: hasImages,
          });
          console.log(`[ChatService] ✅ Notification envoyée avec succès à ${actualReceiverId}`);
          console.log(`[ChatService] ========== FIN ENVOI NOTIFICATION ==========`);
        } catch (notifError: any) {
          console.error(`[ChatService] ❌ Erreur lors de l'envoi de la notification à ${actualReceiverId}:`, notifError?.message || notifError);
          console.error(`[ChatService] Stack trace:`, notifError?.stack);
          // Ne pas faire échouer l'envoi du message si la notification échoue
        }
      } else {
        console.error(`[ChatService] ❌ Impossible d'envoyer la notification: actualReceiverId est null ou vide`);
        console.error(`[ChatService] ❌ Message créé mais notification non envoyée`);
        console.error(`[ChatService] ❌ receiverId: ${receiverId}, actualReceiverId: ${actualReceiverId}`);
      }
    } catch (error) {
      console.error('[ChatService] Erreur lors de l\'envoi de la notification:', error);
      // Ne pas faire échouer l'envoi du message si la notification échoue
    }

    return enrichedMessage;
  }

  async getMessagesByVisite(visiteId: string, userId: string): Promise<any[]> {
    // Vérifier que la visite existe
    const visite = await this.visiteService.findOneRaw(visiteId);
    
    if (!visite) {
      throw new NotFoundException('Visite non trouvée');
    }

    // Normaliser les IDs
    const normalizedVisiteUserId = String(visite.userId || '').trim();
    const normalizedUserId = String(userId || '').trim();
    
    console.log(`[ChatService] ========== DEBUG getMessagesByVisite ==========`);
    console.log(`[ChatService] visiteId: ${visiteId}`);
    console.log(`[ChatService] userId demandé: ${normalizedUserId}`);
    console.log(`[ChatService] visite.userId: ${normalizedVisiteUserId}`);
    
    // SIMPLIFICATION: Vérifier d'abord si l'utilisateur est le client de la visite
    const isClient = normalizedVisiteUserId === normalizedUserId;
    
    // SIMPLIFICATION: Vérifier si l'utilisateur a déjà participé à la conversation (envoyé ou reçu des messages)
    const userMessages = await this.messageModel.findOne({
      visiteId,
      $or: [
        { senderId: normalizedUserId },
        { receiverId: normalizedUserId }
      ]
    }).exec();
    
    const hasParticipated = userMessages !== null;
    
    // SIMPLIFICATION MAXIMALE: Vérifier si l'utilisateur est le collector
    // 1. Via getCollectorIdFromVisite
    const collectorId = await this.getCollectorIdFromVisite(visiteId);
    const normalizedCollectorId = collectorId ? String(collectorId).trim() : null;
    let isCollector = normalizedCollectorId !== null && normalizedCollectorId !== 'default-owner-id' && normalizedCollectorId === normalizedUserId;
    
    // 2. Si pas trouvé, vérifier directement via le logement de la visite
    if (!isCollector && visite.logementId) {
      try {
        let logement: Logement | null = null;
        try {
          if (Types.ObjectId.isValid(visite.logementId) && new Types.ObjectId(visite.logementId).toString() === visite.logementId) {
            logement = await this.logementService.findOne(visite.logementId);
          } else {
            logement = await this.logementService.findByAnnonceId(visite.logementId);
          }
        } catch (e) {
          console.warn(`[ChatService] Erreur récupération logement: ${e}`);
        }
        
        if (logement) {
          const logementOwnerId = String(logement.ownerId || '').trim();
          if (logementOwnerId === normalizedUserId) {
            isCollector = true;
            console.log(`[ChatService] ✅ Collector identifié via le logement (ownerId: ${logementOwnerId})`);
          }
        }
      } catch (e) {
        console.warn(`[ChatService] Erreur vérification logement: ${e}`);
      }
    }
    
    // 3. Dernière vérification: chercher si l'utilisateur possède des logements et si l'un correspond à cette visite
    if (!isCollector && visite.logementId) {
      try {
        const userLogements = await this.logementService.findByOwnerId(normalizedUserId);
        const visiteLogementId = String(visite.logementId).trim();
        
        const ownsThisLogement = userLogements.some(log => {
          // Utiliser un cast pour accéder à _id (propriété Mongoose)
          const logId = String((log as any)._id || '').trim();
          const logAnnonceId = String(log.annonceId || '').trim();
          return logId === visiteLogementId || logAnnonceId === visiteLogementId;
        });
        
        if (ownsThisLogement) {
          isCollector = true;
          console.log(`[ChatService] ✅ Collector identifié via la liste de ses logements`);
        }
      } catch (e) {
        console.warn(`[ChatService] Erreur vérification logements utilisateur: ${e}`);
      }
    }
    
    // 4. Si toujours pas trouvé, chercher le collector dans les messages existants (même sans hasParticipated)
    if (!isCollector) {
      // Chercher si l'utilisateur a envoyé un message au client
      const collectorMessage = await this.messageModel.findOne({
        visiteId,
        senderId: normalizedUserId, // L'utilisateur a envoyé un message
        receiverId: normalizedVisiteUserId // Au client
      }).sort({ createdAt: -1 }).exec();
      
      if (collectorMessage) {
        isCollector = true;
        console.log(`[ChatService] ✅ Collector identifié via les messages (a envoyé au client)`);
      } else {
        // Chercher si l'utilisateur a reçu un message du client
        const receivedFromClient = await this.messageModel.findOne({
          visiteId,
          senderId: normalizedVisiteUserId, // Le client a envoyé
          receiverId: normalizedUserId // À l'utilisateur actuel
        }).sort({ createdAt: -1 }).exec();
        
        if (receivedFromClient) {
          isCollector = true;
          console.log(`[ChatService] ✅ Collector identifié via les messages (a reçu du client)`);
        }
      }
    }
    
    console.log(`[ChatService] isClient: ${isClient}, isCollector: ${isCollector}, hasParticipated: ${hasParticipated}`);
    
    // AUTORISER si: client OU collector OU a déjà participé à la conversation
    // Si la visite est confirmée et que l'utilisateur n'est pas le client, on assume qu'il est le collector
    if (!isClient && !isCollector && !hasParticipated) {
      // Dernière chance: si la visite est confirmée, autoriser l'accès (probablement le collector)
      if (visite.status === 'confirmed') {
        console.log(`[ChatService] ⚠️ Visite confirmée - Autorisation conditionnelle (assume collector)`);
        isCollector = true; // Forcer l'autorisation
      } else {
        console.error(`[ChatService] ❌ Accès refusé - userId: ${normalizedUserId} n'est ni le client (${normalizedVisiteUserId}) ni le collector ni n'a participé`);
        throw new ForbiddenException(`Vous n'êtes pas autorisé à voir les messages de cette visite.`);
      }
    }

    console.log(`[ChatService] ✅ Accès autorisé - ${isClient ? 'Client' : (isCollector ? 'Collector' : 'Participant')}`);
    console.log(`[ChatService] ========== FIN DEBUG ==========`);

    const messages = await this.messageModel
      .find({ visiteId })
      .sort({ createdAt: 1 })
      .exec();

    console.log(`[ChatService] ${messages.length} message(s) trouvé(s) pour la visite ${visiteId}`);

    return Promise.all(messages.map(msg => this.enrichMessage(msg)));
  }

  async markAsRead(messageId: string, userId: string): Promise<any> {
    const message = await this.messageModel.findById(messageId).exec();
    
    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    // Vérifier que l'utilisateur est le destinataire
    if (message.receiverId !== userId) {
      throw new ForbiddenException('Vous ne pouvez marquer comme lu que vos propres messages reçus');
    }

    message.read = true;
    message.readAt = new Date();
    await message.save();

    return this.enrichMessage(message);
  }

  async markAllAsRead(visiteId: string, userId: string): Promise<void> {
    const visite = await this.visiteService.findOneRaw(visiteId);
    
    if (!visite) {
      throw new NotFoundException('Visite non trouvée');
    }

    // Normaliser les IDs
    const normalizedVisiteUserId = String(visite.userId || '').trim();
    const normalizedUserId = String(userId || '').trim();
    
    // Vérifier que l'utilisateur est bien le client ou le colocataire
    const collectorId = await this.getCollectorIdFromVisite(visiteId);
    const normalizedCollectorId = collectorId ? String(collectorId).trim() : null;
    
    const isClient = normalizedVisiteUserId === normalizedUserId;
    let isCollector = normalizedCollectorId !== null && normalizedCollectorId !== 'default-owner-id' && normalizedCollectorId === normalizedUserId;
    
    // Si collectorId est "default-owner-id", chercher le vrai collector dans les messages
    if (!isCollector && (normalizedCollectorId === 'default-owner-id' || !normalizedCollectorId)) {
      const collectorMessage = await this.messageModel.findOne({
        visiteId,
        senderId: { $ne: normalizedVisiteUserId },
        receiverId: normalizedVisiteUserId
      }).sort({ createdAt: -1 }).exec();
      
      if (collectorMessage) {
        const messageSenderId = String(collectorMessage.senderId).trim();
        if (messageSenderId === normalizedUserId) {
          isCollector = true;
        }
      }
    }
    
    // Si l'utilisateur n'est ni le client ni le colocataire identifié, vérifier s'il est impliqué dans la conversation
    let isInvolvedInConversation = false;
    if (!isClient && !isCollector) {
      const userMessages = await this.messageModel.findOne({
        visiteId,
        $or: [
          { senderId: normalizedUserId },
          { receiverId: normalizedUserId }
        ]
      }).exec();
      
      isInvolvedInConversation = userMessages !== null;
    }
    
    if (!isClient && !isCollector && !isInvolvedInConversation) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à accéder à ce chat');
    }

    await this.messageModel.updateMany(
      { visiteId, receiverId: normalizedUserId, read: false },
      { read: true, readAt: new Date() }
    ).exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageModel.countDocuments({ receiverId: userId, read: false }).exec();
  }

  private async getCollectorIdFromVisite(visiteId: string): Promise<string | null> {
    try {
      const visite = await this.visiteService.findOneRaw(visiteId);
      if (!visite || !visite.logementId) {
        console.warn(`[ChatService] ⚠️ Visite ${visiteId} n'a pas de logementId`);
        return null;
      }

      console.log(`[ChatService] 🔍 Recherche du logement avec logementId: ${visite.logementId}`);

      // Utiliser la même logique que VisiteService pour récupérer le logement
      let logement: Logement | null = null;
      try {
        // Vérifier si c'est un ObjectId valide
        const isValidObjectId = Types.ObjectId.isValid(visite.logementId) && 
                               new Types.ObjectId(visite.logementId).toString() === visite.logementId;
        
        console.log(`[ChatService] logementId est un ObjectId valide? ${isValidObjectId}`);
        
        if (isValidObjectId) {
          console.log(`[ChatService] Tentative de récupération par _id: ${visite.logementId}`);
          logement = await this.logementService.findOne(visite.logementId);
        } else {
          console.log(`[ChatService] Tentative de récupération par annonceId: ${visite.logementId}`);
          logement = await this.logementService.findByAnnonceId(visite.logementId);
        }
      } catch (e: any) {
        console.error(`[ChatService] ❌ Erreur lors de la récupération du logement ${visite.logementId}:`, e.message);
        console.error(`[ChatService] Stack trace:`, e.stack);
        return null;
      }
      
      if (!logement) {
        console.warn(`[ChatService] ⚠️ Logement ${visite.logementId} non trouvé (retour null)`);
        return null;
      }
      
      console.log(`[ChatService] ✅ Logement trouvé - ownerId: ${logement.ownerId}, title: ${logement.title}`);
      return logement.ownerId || null;
    } catch (error: any) {
      console.error('[ChatService] ❌ Erreur lors de la récupération du collector:', error);
      console.error('[ChatService] Stack trace:', error?.stack);
      return null;
    }
  }

  private async enrichMessage(message: MessageDocument): Promise<any> {
    const messageObj: any = message.toObject();
    
    try {
      const sender = await this.usersService.findById(message.senderId);
      if (sender) {
        messageObj.senderName = sender.username;
        messageObj.senderEmail = sender.email;
      }
    } catch (e) {
      // Ignorer les erreurs silencieusement
    }

    try {
      const receiver = await this.usersService.findById(message.receiverId);
      if (receiver) {
        messageObj.receiverName = receiver.username;
        messageObj.receiverEmail = receiver.email;
      }
    } catch (e) {
      // Ignorer les erreurs silencieusement
    }

    return messageObj;
  }
}

