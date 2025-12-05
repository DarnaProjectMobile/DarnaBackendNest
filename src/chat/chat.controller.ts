import { Controller, Get, Post, Body, Param, UseGuards, Patch, Delete, UseInterceptors, UploadedFiles, UploadedFile, BadRequestException, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/common/current-user.decorator';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MarkReadDto } from './dto/mark-read.dto';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Post('message')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'images', maxCount: 5 }],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const uploadPath = './uploads/chat';
            if (!existsSync(uploadPath)) {
              mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
          },
          filename: (req, file, cb) => {
            // Nettoyer le nom de fichier original pour enlever les espaces
            const cleanOriginalName = file.originalname.trim().replace(/\s+/g, '-');
            const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + '-' + cleanOriginalName;
            cb(null, uniqueName);
          },
        }),
        fileFilter: (req, file, cb) => {
          try {
            console.log(`🔍 [message] File filter - mimetype: ${file.mimetype}, originalname: ${file.originalname}`);

            // Extraire l'extension du fichier
            const ext = file.originalname.toLowerCase().split('.').pop() || '';
            const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

            // Si pas de mimetype ou mimetype générique, vérifier l'extension
            if (!file.mimetype || file.mimetype === 'image/*' || file.mimetype === 'application/octet-stream') {
              if (validExtensions.includes(ext)) {
                console.log(`✅ [message] File accepted by extension: ${ext} (mimetype: ${file.mimetype || 'none'})`);
                cb(null, true);
                return;
              } else {
                console.error(`❌ [message] File rejected - invalid extension: ${ext}`);
                cb(new Error(`Extension de fichier non autorisée: ${ext}. Seuls les fichiers images (jpg, jpeg, png, gif, webp) sont autorisés!`), false);
                return;
              }
            }

            // Normaliser le mimetype pour la comparaison
            const normalizedMime = file.mimetype.toLowerCase();

            // Accepter les différents formats de mimetype d'images
            const imageMimeTypes = [
              'image/jpeg',
              'image/jpg',
              'image/png',
              'image/gif',
              'image/webp',
              'image/x-png',
              'image/pjpeg',
            ];

            // Vérifier si le mimetype correspond à un type d'image
            const isImage = imageMimeTypes.some(mime => normalizedMime.includes(mime)) ||
              normalizedMime.match(/^image\/(jpeg|jpg|png|gif|webp|x-png|pjpeg)$/);

            if (isImage) {
              console.log(`✅ [message] File type accepted: ${file.mimetype}`);
              cb(null, true);
            } else if (validExtensions.includes(ext)) {
              // Si le mimetype n'est pas reconnu mais l'extension est valide, accepter
              console.log(`✅ [message] File accepted by extension despite mimetype: ${file.mimetype} (ext: ${ext})`);
              cb(null, true);
            } else {
              console.error(`❌ [message] File type rejected: ${file.mimetype}, extension: ${ext}`);
              cb(new Error(`Type de fichier non autorisé: ${file.mimetype}. Seuls les fichiers images (jpg, jpeg, png, gif, webp) sont autorisés!`), false);
            }
          } catch (error) {
            console.error('❌ [message] Error in fileFilter:', error);
            cb(error as Error, false);
          }
        },
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB max per file
        },
      },
    ),
  )
  @ApiOperation({ summary: 'Envoyer un message (texte et/ou images) pour une visite acceptée' })
  @ApiResponse({ status: 201, description: 'Message envoyé avec succès' })
  @ApiResponse({ status: 403, description: 'Visite non acceptée ou accès refusé' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  async createMessage(
    @Body() body: any,
    @CurrentUser() user: any,
    @UploadedFiles() files?: { images?: Express.Multer.File[] },
  ) {
    // Extraire les champs du body multipart
    // Multer peut parser les champs texte différemment selon la version
    let visiteId: string;
    let content: string | undefined;

    if (typeof body.visiteId === 'string') {
      visiteId = body.visiteId;
    } else if (Array.isArray(body.visiteId)) {
      visiteId = body.visiteId[0];
    } else if (body.visiteId) {
      visiteId = String(body.visiteId);
    } else {
      throw new Error('visiteId est requis');
    }

    if (body.content) {
      if (typeof body.content === 'string') {
        content = body.content;
      } else if (Array.isArray(body.content)) {
        content = body.content[0];
      } else {
        content = String(body.content);
      }
    }

    const createMessageDto: CreateMessageDto = {
      visiteId,
      content: content || undefined,
      images: [],
    };

    // Si des fichiers sont uploadés, ajouter leurs URLs au DTO
    if (files?.images && files.images.length > 0) {
      createMessageDto.images = files.images.map(file => {
        // Nettoyer le filename pour enlever les espaces et caractères spéciaux
        const cleanFilename = file.filename.trim().replace(/\s+/g, '-');
        const imageUrl = `/uploads/chat/${cleanFilename}`;
        console.log(`📸 [createMessage] Image URL: ${imageUrl} (original filename: ${file.filename})`);
        return imageUrl;
      });
      console.log(`📸 [createMessage] ${files.images.length} image(s) uploadée(s):`, createMessageDto.images);
    } else {
      console.log(`📸 [createMessage] Aucune image dans la requête`);
    }

    console.log(`📤 [createMessage] DTO complet:`, JSON.stringify(createMessageDto, null, 2));
    const result = await this.chatService.createMessage(createMessageDto, user.userId);
    console.log(`✅ [createMessage] Message créé avec images:`, result.images);
    return result;
  }

  @Get('visite/:visiteId/messages')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer tous les messages d\'une visite' })
  @ApiParam({ name: 'visiteId', description: 'ID de la visite' })
  @ApiResponse({ status: 200, description: 'Liste des messages' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  async getMessages(
    @Param('visiteId') visiteId: string,
    @CurrentUser() user: any,
  ) {
    const messages = await this.chatService.getMessagesByVisite(visiteId, user.userId);

    // Log pour vérifier que les images sont bien dans les messages retournés
    const messagesWithImages = messages.filter((msg: any) => msg.images && msg.images.length > 0);
    console.log(`📤 [getMessages] ${messagesWithImages.length} message(s) avec images sur ${messages.length} total`);
    messagesWithImages.forEach((msg: any, index: number) => {
      console.log(`📤 [getMessages] Message ${index + 1} avec images:`, {
        id: msg._id || msg.id,
        images: msg.images,
        imagesCount: msg.images?.length || 0
      });
    });

    return messages;
  }

  @Patch('message/:messageId/read')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Marquer un message comme lu' })
  @ApiParam({ name: 'messageId', description: 'ID du message' })
  @ApiResponse({ status: 200, description: 'Message marqué comme lu' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Message non trouvé' })
  async markAsRead(
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.markAsRead(messageId, user.userId);
  }

  @Post('visite/:visiteId/mark-all-read')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Marquer tous les messages d\'une visite comme lus' })
  @ApiParam({ name: 'visiteId', description: 'ID de la visite' })
  @ApiResponse({ status: 200, description: 'Messages marqués comme lus' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  async markAllAsRead(
    @Param('visiteId') visiteId: string,
    @CurrentUser() user: any,
  ) {
    await this.chatService.markAllAsRead(visiteId, user.userId);
    return { success: true, message: 'Tous les messages ont été marqués comme lus' };
  }

  @Get('unread-count')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer le nombre de messages non lus' })
  @ApiResponse({ status: 200, description: 'Nombre de messages non lus' })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.chatService.getUnreadCount(user.userId);
    return { unreadCount: count };
  }

  @Post('upload-images')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @UsePipes(new ValidationPipe({ skipMissingProperties: true, skipNullProperties: true, skipUndefinedProperties: true, whitelist: false, transform: false }))
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'images', maxCount: 5 }],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            try {
              const uploadPath = './uploads/chat';
              if (!existsSync(uploadPath)) {
                mkdirSync(uploadPath, { recursive: true });
              }
              console.log(`📁 Destination: ${uploadPath} for file: ${file.originalname}`);
              cb(null, uploadPath);
            } catch (error) {
              console.error('❌ Error in destination:', error);
              cb(error as Error, '');
            }
          },
          filename: (req, file, cb) => {
            try {
              const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + '-' + file.originalname;
              console.log(`📝 Filename generated: ${uniqueName} for: ${file.originalname}`);
              cb(null, uniqueName);
            } catch (error) {
              console.error('❌ Error in filename:', error);
              cb(error as Error, '');
            }
          },
        }),
        fileFilter: (req, file, cb) => {
          try {
            console.log(`🔍 [upload-images] File filter - mimetype: ${file.mimetype}, originalname: ${file.originalname}`);

            // Extraire l'extension du fichier
            const ext = file.originalname.toLowerCase().split('.').pop() || '';
            const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

            // Si pas de mimetype ou mimetype générique, vérifier l'extension
            if (!file.mimetype || file.mimetype === 'image/*' || file.mimetype === 'application/octet-stream') {
              if (validExtensions.includes(ext)) {
                console.log(`✅ [upload-images] File accepted by extension: ${ext} (mimetype: ${file.mimetype || 'none'})`);
                cb(null, true);
                return;
              } else {
                console.error(`❌ [upload-images] File rejected - invalid extension: ${ext}`);
                cb(new Error(`Extension de fichier non autorisée: ${ext}. Seuls les fichiers images (jpg, jpeg, png, gif, webp) sont autorisés!`), false);
                return;
              }
            }

            // Normaliser le mimetype pour la comparaison
            const normalizedMime = file.mimetype.toLowerCase();

            // Accepter les différents formats de mimetype d'images
            const imageMimeTypes = [
              'image/jpeg',
              'image/jpg',
              'image/png',
              'image/gif',
              'image/webp',
              'image/x-png',
              'image/pjpeg',
            ];

            // Vérifier si le mimetype correspond à un type d'image
            const isImage = imageMimeTypes.some(mime => normalizedMime.includes(mime)) ||
              normalizedMime.match(/^image\/(jpeg|jpg|png|gif|webp|x-png|pjpeg)$/);

            if (isImage) {
              console.log(`✅ [upload-images] File type accepted: ${file.mimetype}`);
              cb(null, true);
            } else if (validExtensions.includes(ext)) {
              // Si le mimetype n'est pas reconnu mais l'extension est valide, accepter
              console.log(`✅ [upload-images] File accepted by extension despite mimetype: ${file.mimetype} (ext: ${ext})`);
              cb(null, true);
            } else {
              console.error(`❌ [upload-images] File type rejected: ${file.mimetype}, extension: ${ext}`);
              cb(new Error(`Type de fichier non autorisé: ${file.mimetype}. Seuls les fichiers images (jpg, jpeg, png, gif, webp) sont autorisés!`), false);
            }
          } catch (error) {
            console.error('❌ [upload-images] Error in fileFilter:', error);
            cb(error as Error, false);
          }
        },
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB max per file
        },
      },
    ),
  )
  @ApiOperation({ summary: 'Uploader des images pour le chat' })
  @ApiResponse({ status: 200, description: 'Images uploadées avec succès' })
  @ApiResponse({ status: 400, description: 'Aucune image fournie ou fichier invalide' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async uploadImages(
    @CurrentUser() user: any,
    @Body() body: any,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ) {
    console.log('📤 Upload images - Request received');
    console.log('📤 Upload images - User:', user?.userId);
    console.log('📤 Upload images - Body:', body);
    console.log('📤 Upload images - Files received:', files ? Object.keys(files) : 'null');

    // Vérifier que l'utilisateur est authentifié
    if (!user || !user.userId) {
      console.error('❌ User not authenticated');
      throw new BadRequestException('Utilisateur non authentifié');
    }

    if (!files) {
      console.error('❌ No files object in request');
      throw new BadRequestException('Aucun fichier reçu dans la requête');
    }

    if (!files.images || files.images.length === 0) {
      console.error('❌ No images provided in upload');
      console.error('❌ Files object keys:', Object.keys(files));
      throw new BadRequestException('Aucune image fournie. Assurez-vous d\'envoyer les fichiers avec le nom de champ "images"');
    }

    console.log(`✅ ${files.images.length} image(s) received for user ${user.userId}`);
    files.images.forEach((file, index) => {
      console.log(`  Image ${index + 1}: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);
    });

    const imageUrls = files.images.map(file => {
      // Nettoyer le filename pour enlever les espaces
      const cleanFilename = file.filename.trim().replace(/\s+/g, '-');
      const imageUrl = `/uploads/chat/${cleanFilename}`;
      console.log(`📸 [uploadImages] Image URL: ${imageUrl} (original filename: ${file.filename})`);
      return imageUrl;
    });
    return { images: imageUrls };
  }

  // Nouveaux endpoints pour suppression, modification et statuts

  @Delete('message/:messageId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un message (soft delete)' })
  @ApiParam({ name: 'messageId', description: 'ID du message à supprimer' })
  @ApiResponse({ status: 200, description: 'Message supprimé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé - vous ne pouvez supprimer que vos propres messages' })
  @ApiResponse({ status: 404, description: 'Message non trouvé' })
  async deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.deleteMessage(messageId, user.userId);
  }

  @Patch('message/:messageId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Modifier le contenu d\'un message' })
  @ApiParam({ name: 'messageId', description: 'ID du message à modifier' })
  @ApiResponse({ status: 200, description: 'Message modifié avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé - vous ne pouvez modifier que vos propres messages texte' })
  @ApiResponse({ status: 404, description: 'Message non trouvé' })
  async updateMessage(
    @Param('messageId') messageId: string,
    @Body() updateMessageDto: { content: string },
    @CurrentUser() user: any,
  ) {
    return this.chatService.updateMessage(messageId, updateMessageDto.content, user.userId);
  }

  @Patch('message/:messageId/status')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'un message (sent, delivered, read)' })
  @ApiParam({ name: 'messageId', description: 'ID du message' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé - vous ne pouvez mettre à jour que le statut des messages reçus' })
  @ApiResponse({ status: 404, description: 'Message non trouvé' })
  async updateMessageStatus(
    @Param('messageId') messageId: string,
    @Body() updateStatusDto: { status: string },
    @CurrentUser() user: any,
  ) {
    return this.chatService.updateMessageStatus(messageId, updateStatusDto.status, user.userId);
  }

  @Post('message/:messageId/reaction')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Ajouter ou retirer une réaction' })
  @ApiParam({ name: 'messageId', description: 'ID du message' })
  async toggleReaction(
    @Param('messageId') messageId: string,
    @Body() toggleReactionDto: { emoji: string },
    @CurrentUser() user: any,
  ) {
    return this.chatService.toggleReaction(messageId, toggleReactionDto.emoji, user.userId);
  }
}






