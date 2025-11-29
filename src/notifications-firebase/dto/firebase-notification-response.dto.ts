import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../notification-type.enum';

export class FirebaseNotificationResponseDto {
  @ApiProperty({
    description: 'ID Firestore de la notification',
    example: 'notif-123',
    required: false,
    nullable: true,
  })
  id?: string;

  @ApiProperty({ description: 'ID utilisateur destinataire', example: 'user-abc' })
  userId: string;

  @ApiProperty({
    description: 'Type de notification',
    enum: NotificationType,
    example: NotificationType.VISIT_ACCEPTED,
  })
  type: NotificationType;

  @ApiProperty({ description: 'Titre de la notification', example: 'Visite acceptée' })
  title: string;

  @ApiProperty({
    description: 'Message détaillé',
    example: 'Votre visite pour Appartement 3 pièces a été acceptée.',
  })
  body: string;

  @ApiProperty({ description: 'ID de la visite associée', example: 'visite-789', nullable: true })
  visitId: string | null;

  @ApiProperty({ description: 'ID du logement associé', example: 'logement-456', nullable: true })
  housingId: string | null;

  @ApiProperty({
    description: 'Rôle du destinataire',
    enum: ['CLIENT', 'COLLECTOR'],
    example: 'CLIENT',
  })
  role: 'CLIENT' | 'COLLECTOR';

  @ApiProperty({ description: 'Statut de lecture', example: false })
  isRead: boolean;

  @ApiProperty({
    description: 'Rôle de l’émetteur',
    enum: ['CLIENT', 'COLLECTOR'],
    example: 'COLLECTOR',
  })
  sentBy: 'CLIENT' | 'COLLECTOR';

  @ApiProperty({
    description: 'Date de création (timestamp Firestore)',
    example: '2024-11-28T21:00:00.000Z',
  })
  createdAt: Date | string | number;
}

