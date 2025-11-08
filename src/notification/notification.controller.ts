import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('Notification')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle notification' })
  @ApiResponse({ status: 201, description: 'Notification créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiBody({ type: CreateNotificationDto })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les notifications ou filtrer par userId/unread' })
  @ApiQuery({ name: 'userId', required: false, description: 'ID de l\'utilisateur' })
  @ApiQuery({ name: 'unread', required: false, description: 'Filtrer les non lues (true)' })
  @ApiResponse({ status: 200, description: 'Liste des notifications' })
  findAll(@Query('userId') userId?: string, @Query('unread') unread?: string) {
    if (userId && unread === 'true') {
      return this.notificationService.findUnreadByUserId(userId);
    }
    if (userId) {
      return this.notificationService.findByUserId(userId);
    }
    return this.notificationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une notification par ID' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification trouvée' })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  findOne(@Param('id') id: string) {
    return this.notificationService.findOne(id);
  }

  @Put('user/:userId/read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications d\'un utilisateur comme lues' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Toutes les notifications marquées comme lues' })
  markAllAsRead(@Param('userId') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification marquée comme lue' })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une notification' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiBody({ type: UpdateNotificationDto })
  @ApiResponse({ status: 200, description: 'Notification mise à jour' })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une notification' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification supprimée' })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  remove(@Param('id') id: string) {
    return this.notificationService.remove(id);
  }
}
