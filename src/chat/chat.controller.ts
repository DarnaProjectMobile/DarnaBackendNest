import { Controller, Get, Post, Body, Param, UseGuards, Patch, UseInterceptors, UploadedFiles, UploadedFile } from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/common/current-user.decorator';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MarkReadDto } from './dto/mark-read.dto';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'images', maxCount: 5 }],
      {
        storage: diskStorage({
          destination: './uploads/chat',
          filename: (req, file, cb) =>
            cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + '-' + file.originalname),
        }),
        fileFilter: (req, file, cb) => {
          if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
            cb(new Error('Seuls les fichiers images sont autorisés!'), false);
          } else {
            cb(null, true);
          }
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
      createMessageDto.images = files.images.map(file => `/uploads/chat/${file.filename}`);
    }

    return this.chatService.createMessage(createMessageDto, user.userId);
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
    return this.chatService.getMessagesByVisite(visiteId, user.userId);
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
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'images', maxCount: 5 }],
      {
        storage: diskStorage({
          destination: './uploads/chat',
          filename: (req, file, cb) =>
            cb(null, Date.now() + '-' + file.originalname),
        }),
      },
    ),
  )
  @ApiOperation({ summary: 'Uploader des images pour le chat' })
  @ApiResponse({ status: 200, description: 'Images uploadées avec succès' })
  @ApiResponse({ status: 400, description: 'Aucune image fournie' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async uploadImages(
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ) {
    if (!files.images || files.images.length === 0) {
      throw new Error('Aucune image fournie');
    }
    const imageUrls = files.images.map(file => `/uploads/chat/${file.filename}`);
    return { images: imageUrls };
  }
}





