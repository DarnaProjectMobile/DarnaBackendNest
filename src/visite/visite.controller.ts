import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put, UseGuards, ForbiddenException } from '@nestjs/common';
import { VisiteService } from './visite.service';
import { CreateVisiteDto } from './dto/create-visite.dto';
import { UpdateVisiteDto } from './dto/update-visite.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorators';
import { CurrentUser } from '../auth/common/current-user.decorator';
import { Role } from '../auth/common/role.enum';

@ApiTags('Visite')
@Controller('visite')
@UseGuards(JwtAuthGuard) // Tous les endpoints nécessitent l'authentification
export class VisiteController {
  constructor(private readonly visiteService: VisiteService) {}

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
    return this.visiteService.updateStatus(id, 'confirmed');
  }

  // 🏠 CÔTÉ COLOCATAIRE : Refuser une visite
  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Refuser une visite (Colocataire uniquement) - Change le statut à "cancelled"' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiResponse({ status: 200, description: 'Visite refusée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Colocataire uniquement' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  rejectVisite(@Param('id') id: string) {
    return this.visiteService.updateStatus(id, 'cancelled');
  }

  // 🏠 CÔTÉ COLOCATAIRE : Mettre à jour le statut d'une visite (méthode générique)
  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une visite (Colocataire uniquement)' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  @ApiResponse({ status: 400, description: 'Statut invalide' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Colocataire uniquement' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    return this.visiteService.updateStatus(id, body.status);
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
}
