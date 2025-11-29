import { Body, Controller, Get, Param, Patch, Post, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { NotificationsFirebaseService } from './notifications-firebase.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/common/current-user.decorator';
import { TestNotificationDto } from './dto/test-notification.dto';
import { FirebaseNotificationResponseDto } from './dto/firebase-notification-response.dto';

@ApiTags('Notifications Firebase')
@Controller('notifications-firebase')
@UseGuards(JwtAuthGuard)
export class NotificationsFirebaseController {
  constructor(
    private readonly notificationsService: NotificationsFirebaseService,
  ) {}

  @Post('register-token')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Enregistrer un token FCM pour recevoir les notifications push' })
  @ApiResponse({ status: 200, description: 'Token enregistré avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 500, description: 'Erreur serveur lors de l\'enregistrement' })
  @ApiBody({ type: RegisterTokenDto })
  async registerToken(
    @CurrentUser() user: any,
    @Body() body: RegisterTokenDto,
  ): Promise<{ success: boolean }> {
    try {
      // Vérification que l'utilisateur est bien authentifié
      if (!user || !user.userId) {
        console.error('[NotificationsFirebaseController] Utilisateur non authentifié ou userId manquant:', user);
        throw new HttpException('Utilisateur non authentifié', HttpStatus.UNAUTHORIZED);
      }

      console.log(`[NotificationsFirebaseController] Tentative d'enregistrement du token FCM pour l'utilisateur: ${user.userId}, platform: ${body.platform}`);
      
      await this.notificationsService.registerToken(user.userId, body.platform, body.fcmToken);
      
      console.log(`[NotificationsFirebaseController] Token FCM enregistré avec succès pour l'utilisateur: ${user.userId}`);
      return { success: true };
    } catch (error: any) {
      console.error('[NotificationsFirebaseController] Erreur lors de l\'enregistrement du token:', error);
      console.error('[NotificationsFirebaseController] Stack trace:', error?.stack);
      
      // Si c'est déjà une HttpException, on la propage telle quelle
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Sinon, on crée une HttpException avec le message d'erreur
      const errorMessage = error?.message || 'Erreur lors de l\'enregistrement du token FCM';
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer toutes mes notifications' })
  @ApiResponse({
    status: 200,
    description: 'Liste des notifications',
    type: FirebaseNotificationResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async getMyNotifications(@CurrentUser() user: any): Promise<FirebaseNotificationResponseDto[]> {
    try {
      return await this.notificationsService.getUserNotifications(user.userId);
    } catch (error: any) {
      console.error('[NotificationsFirebaseController] Erreur lors de la récupération des notifications:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || 'Erreur lors de la récupération des notifications',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/read')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification marquée comme lue' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async markAsRead(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    try {
      await this.notificationsService.markAsRead(user.userId, id);
      return { success: true };
    } catch (error: any) {
      console.error('[NotificationsFirebaseController] Erreur lors du marquage de la notification comme lue:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || 'Erreur lors du marquage de la notification comme lue',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Envoyer une notification de test (pour développement)' })
  @ApiResponse({ status: 200, description: 'Notification de test envoyée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  @ApiBody({ type: TestNotificationDto })
  async sendTestNotification(
    @CurrentUser() user: any,
    @Body() body: TestNotificationDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.notificationsService.sendTestNotification(user.userId, body.title, body.body);
      return { 
        success: true, 
        message: 'Notification de test envoyée. Vérifiez votre appareil si vous avez enregistré un token FCM.' 
      };
    } catch (error: any) {
      console.error('[NotificationsFirebaseController] Erreur lors de l\'envoi de la notification de test:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || 'Erreur lors de l\'envoi de la notification de test',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}



