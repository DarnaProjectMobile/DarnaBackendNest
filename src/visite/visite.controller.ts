import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put, UseGuards, ForbiddenException, UploadedFiles, UseInterceptors, BadRequestException } from '@nestjs/common';
import * as NestPlatformExpress from '@nestjs/platform-express';
const FileFieldsInterceptor = (NestPlatformExpress as any).FileFieldsInterceptor;
import { VisiteService } from './visite.service';
import { CreateVisiteDto } from './dto/create-visite.dto';
import { UpdateVisiteDto } from './dto/update-visite.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UploadDocumentsDto } from './dto/upload-documents.dto';
import { CreateReviewDto } from '../reviews/dto/create-review.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorators';
import { CurrentUser } from '../auth/common/current-user.decorator';
import { Role } from '../auth/common/role.enum';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';

@ApiTags('Visite')
@Controller('visite')
@UseGuards(JwtAuthGuard) // Tous les endpoints nécessitent l'authentification
export class VisiteController {
  constructor(private readonly visiteService: VisiteService) { }

  // 👤 CÔTÉ CLIENT : Créer une visite
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Client)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer une nouvelle visite (Client uniquement)' })
  @ApiResponse({ status: 201, description: 'Visite créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Client uniquement' })
  @ApiBody({ type: CreateVisiteDto })
  create(@Body() createVisiteDto: CreateVisiteDto, @CurrentUser() user: any) {
    // Le userId est automatiquement celui de l'utilisateur connecté
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.visiteService.create(createVisiteDto, user.userId);
  }

  // 👤 CÔTÉ CLIENT : Voir ses propres visites
  @Get('my-visites')
  @UseGuards(RolesGuard)
  @Roles(Role.Client)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer mes visites (Client uniquement)' })
  @ApiResponse({ status: 200, description: 'Liste de mes visites' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Client uniquement' })
  getMyVisites(@CurrentUser() user: any) {
    return this.visiteService.findByUserId(user.userId);
  }

  // 🏠 CÔTÉ COLOCATAIRE : Voir les visites de ses logements
  @Get('my-logements-visites')
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer les visites de mes logements (Colocataire uniquement)' })
  @ApiQuery({ name: 'logementId', required: false, description: 'ID du logement (optionnel)' })
  @ApiResponse({ status: 200, description: 'Liste des visites de mes logements' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Colocataire uniquement' })
  getMyLogementsVisites(@Query('logementId') logementId?: string, @CurrentUser() user?: any) {
    if (logementId) {
      return this.visiteService.findByLogementId(logementId);
    }
    // Si pas de logementId, retourner toutes les visites (le service peut filtrer par ownerId si nécessaire)
    return this.visiteService.findAll();
  }

  // 🏠 CÔTÉ COLOCATAIRE : Accepter une visite
  @Post(':id/accept')
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Accepter une visite (Colocataire uniquement) - Change le statut à "confirmed"' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiResponse({ status: 200, description: 'Visite acceptée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Colocataire uniquement' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  acceptVisite(@Param('id') id: string) {
    return this.visiteService.updateStatus(id, 'confirmed', false);
  }

  // 🏠 CÔTÉ COLOCATAIRE : Refuser une visite
  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Refuser une visite (Colocataire uniquement) - Change le statut à "refused"' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiResponse({ status: 200, description: 'Visite refusée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Colocataire uniquement' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  rejectVisite(@Param('id') id: string) {
    // Passer directement 'refused' car c'est le colocateur qui refuse
    return this.visiteService.updateStatus(id, 'refused', false);
  }

  // 👤 CÔTÉ CLIENT : Annuler sa propre visite
  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.Client)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Annuler une visite (Client uniquement - seulement ses propres visites) - Change le statut à "cancelled" et notifie le colocateur' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiResponse({ status: 200, description: 'Visite annulée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Client uniquement' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  async cancelVisite(@Param('id') id: string, @CurrentUser() user: any) {
    const visite = await this.visiteService.findOne(id);
    // Vérifier que l'utilisateur est le propriétaire de la visite
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (visite.userId !== user.userId) {
      throw new ForbiddenException('Vous ne pouvez annuler que vos propres visites');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // Passer cancelledByClient = true pour notifier le colocateur
    return this.visiteService.updateStatus(id, 'cancelled', true);
  }

  // 🏠 CÔTÉ COLOCATAIRE : Mettre à jour le statut d'une visite (méthode générique)
  // 👤 CÔTÉ CLIENT : Mettre à jour le statut de sa propre visite (pour annuler uniquement)
  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator, Role.Client)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une visite (Colocataire: tous statuts, Client: seulement "cancelled")' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  @ApiResponse({ status: 400, description: 'Statut invalide' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  async updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto, @CurrentUser() user: any) {
    const visite = await this.visiteService.findOne(id);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (user.role === Role.Client) {
      // Les clients ne peuvent que annuler leurs propres visites
      if (body.status !== 'cancelled') {
        throw new ForbiddenException('Les clients ne peuvent que annuler leurs visites (statut: cancelled)');
      }
      // Vérifier que l'utilisateur est le propriétaire de la visite
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (visite.userId !== user.userId) {
        throw new ForbiddenException('Vous ne pouvez modifier que vos propres visites');
      }
    }
    // Les colocataires peuvent changer le statut librement

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // Si c'est un client qui annule, passer cancelledByClient = true
    const cancelledByClient = user.role === Role.Client && body.status === 'cancelled';
    return this.visiteService.updateStatus(id, body.status, cancelledByClient);
  }

  // 👤 CÔTÉ CLIENT : Voir une visite spécifique (seulement ses propres visites)
  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer une visite par ID' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiResponse({ status: 200, description: 'Visite trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const visite = await this.visiteService.findOne(id);
    // Vérifier que l'utilisateur est le propriétaire de la visite ou le colocataire du logement
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (visite.userId !== user.userId && user.role !== Role.Collocator) {
      throw new ForbiddenException('Accès non autorisé à cette visite');
    }
    return visite;
  }

  // 👤 CÔTÉ CLIENT : Mettre à jour une visite (seulement ses propres visites)
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Client)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour une visite (Client uniquement - seulement ses propres visites)' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiBody({ type: UpdateVisiteDto })
  @ApiResponse({ status: 200, description: 'Visite mise à jour' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  async update(@Param('id') id: string, @Body() updateVisiteDto: UpdateVisiteDto, @CurrentUser() user: any) {
    const visite = await this.visiteService.findOne(id);
    // Vérifier que l'utilisateur est le propriétaire de la visite
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (visite.userId !== user.userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres visites');
    }
    return this.visiteService.update(id, updateVisiteDto);
  }

  // 👤 CÔTÉ CLIENT : Supprimer une visite (seulement ses propres visites)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Client)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer une visite (Client uniquement - seulement ses propres visites)' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiResponse({ status: 200, description: 'Visite supprimée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const visite = await this.visiteService.findOne(id);
    // Vérifier que l'utilisateur est le propriétaire de la visite
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (visite.userId !== user.userId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres visites');
    }
    return this.visiteService.remove(id);
  }

  // 👤 CÔTÉ CLIENT : Valider une visite (après avoir effectué la visite)
  @Post(':id/validate')
  @UseGuards(RolesGuard)
  @Roles(Role.Client)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Valider une visite (Client uniquement) - Marque la visite comme validée et complétée' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiResponse({ status: 200, description: 'Visite validée avec succès' })
  @ApiResponse({ status: 400, description: 'Visite non confirmée ou déjà validée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Client uniquement' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  async validateVisite(@Param('id') id: string, @CurrentUser() user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.visiteService.validateVisite(id, user.userId);
  }

  // 👤 CÔTÉ CLIENT : Uploader des documents pour une visite (après validation)
  @Post(':id/upload-documents')
  @UseGuards(RolesGuard)
  @Roles(Role.Client)
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'documents', maxCount: 10 }],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const uploadPath = './uploads/visites';
            if (!existsSync(uploadPath)) {
              mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
          },
          filename: (req, file, cb) =>
            cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + '-' + file.originalname),
        }),
        fileFilter: (req, file, cb) => {
          // Accepter les images et les PDFs pour les documents
          if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|pdf)$/)) {
            cb(new Error('Seuls les fichiers images (jpg, jpeg, png, gif, webp) et PDF sont autorisés!'), false);
          } else {
            cb(null, true);
          }
        },
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB max per file
        },
      },
    ),
  )
  @ApiOperation({ summary: 'Uploader des documents pour une visite validée (Client uniquement)' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiResponse({ status: 200, description: 'Documents uploadés avec succès' })
  @ApiResponse({ status: 400, description: 'Visite non validée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Client uniquement' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  async uploadDocuments(
    @Param('id') id: string,
    @UploadedFiles() files: { documents?: Express.Multer.File[] },
    @CurrentUser() user: any,
  ) {
    const documentNames = files.documents?.map(file => file.filename) || [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.visiteService.addDocuments(id, documentNames, user.userId);
  }

  // 👤 CÔTÉ CLIENT : Uploader des documents après visite (page de confirmation)
  @Post(':id/upload-confirmation-documents')
  @UseGuards(RolesGuard)
  @Roles(Role.Client)
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'documents', maxCount: 10 }, { name: 'screenshots', maxCount: 10 }],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const uploadPath = './uploads/visites/confirmation';
            if (!existsSync(uploadPath)) {
              mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
          },
          filename: (req, file, cb) =>
            cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + '-' + file.originalname),
        }),
        fileFilter: (req, file, cb) => {
          // Accepter les images et les PDFs
          if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|pdf)$/)) {
            cb(new BadRequestException('Seuls les fichiers images (jpg, jpeg, png, gif, webp) et PDF sont autorisés!'), false);
          } else {
            cb(null, true);
          }
        },
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB max per file
        },
      },
    ),
  )
  @ApiOperation({ summary: 'Uploader des documents/screenshots après visite (Client uniquement - Page de confirmation)' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiResponse({ status: 200, description: 'Documents uploadés avec succès' })
  @ApiResponse({ status: 400, description: 'Visite non validée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Client uniquement' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  async uploadConfirmationDocuments(
    @Param('id') id: string,
    @UploadedFiles() files: { documents?: Express.Multer.File[], screenshots?: Express.Multer.File[] },
    @CurrentUser() user: any,
  ) {
    const allFiles = [
      ...(files.documents?.map(file => file.filename) || []),
      ...(files.screenshots?.map(file => file.filename) || []),
    ];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.visiteService.addDocuments(id, allFiles, user.userId);
  }

  // 👤 CÔTÉ CLIENT : Créer une évaluation/review pour une visite
  @Post(':id/review')
  @UseGuards(RolesGuard)
  @Roles(Role.Client)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer une évaluation pour une visite (Client uniquement)' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: 'Évaluation créée avec succès' })
  @ApiResponse({ status: 400, description: 'Visite non validée ou déjà évaluée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Client uniquement' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  async createReview(
    @Param('id') id: string,
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: any,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.visiteService.createReview(id, createReviewDto, user.userId);
  }


  // 👤 CÔTÉ CLIENT : Récupérer les évaluations d'une visite
  @Get(':id/reviews')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer les évaluations d\'une visite' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiResponse({ status: 200, description: 'Liste des évaluations' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  async getVisiteReviews(@Param('id') id: string) {
    return this.visiteService.getVisiteReviews(id);
  }
}
