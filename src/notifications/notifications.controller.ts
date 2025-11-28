import { Controller, Get, Post, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/common/current-user.decorator';

@ApiTags('Notifications')
@Controller('notification')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('my-notifications')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer mes notifications' })
  @ApiResponse({ status: 200, description: 'Liste des notifications' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  getMyNotifications(@CurrentUser() user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = user.userId;
    console.log(`[NotificationsController] Récupération des notifications pour userId: ${userId}, role: ${user.role}`);
    return this.notificationsService.findByUserId(userId);
  }

  @Get('unread-count')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer le nombre de notifications non lues' })
  @ApiResponse({ status: 200, description: 'Nombre de notifications non lues' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getUnreadCount(@CurrentUser() user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const count = await this.notificationsService.getUnreadCount(user.userId);
    return { count };
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer une notification par ID' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  async getNotificationById(@Param('id') id: string, @CurrentUser() user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.notificationsService.findById(id, user.userId);
  }

  @Put(':id/read')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification marquée comme lue' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.notificationsService.markAsRead(id, user.userId);
  }

  @Put('read-all')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  @ApiResponse({ status: 200, description: 'Toutes les notifications marquées comme lues' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async markAllAsRead(@CurrentUser() user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await this.notificationsService.markAllAsRead(user.userId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.notificationsService.findByUserId(user.userId);
  }

  @Put(':id/hide')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Masquer une notification' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification masquée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  hideNotification(@Param('id') id: string, @CurrentUser() user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.notificationsService.hideNotification(id, user.userId);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer une notification' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification supprimée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.notificationsService.delete(id, user.userId);
  }

  @Post('check-upcoming-visites')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Vérifier et créer des notifications pour les visites à venir (Admin/System)' })
  @ApiResponse({ status: 200, description: 'Vérification effectuée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async checkUpcomingVisites() {
    await this.notificationsService.checkScheduledReminders();
    await this.notificationsService.checkMissedVisites();
    return { message: 'Vérification des visites effectuée avec succès' };
  }
}

