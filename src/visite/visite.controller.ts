import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common';
import { VisiteService } from './visite.service';
import { CreateVisiteDto } from './dto/create-visite.dto';
import { UpdateVisiteDto } from './dto/update-visite.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('Visite')
@Controller('visite')
export class VisiteController {
  constructor(private readonly visiteService: VisiteService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle visite' })
  @ApiResponse({ status: 201, description: 'Visite créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiBody({ type: CreateVisiteDto })
  create(@Body() createVisiteDto: CreateVisiteDto) {
    return this.visiteService.create(createVisiteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les visites ou filtrer par userId/logementId' })
  @ApiQuery({ name: 'userId', required: false, description: 'ID de l\'utilisateur' })
  @ApiQuery({ name: 'logementId', required: false, description: 'ID du logement' })
  @ApiResponse({ status: 200, description: 'Liste des visites' })
  findAll(@Query('userId') userId?: string, @Query('logementId') logementId?: string) {
    if (userId) {
      return this.visiteService.findByUserId(userId);
    }
    if (logementId) {
      return this.visiteService.findByLogementId(logementId);
    }
    return this.visiteService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une visite par ID' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiResponse({ status: 200, description: 'Visite trouvée' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  findOne(@Param('id') id: string) {
    return this.visiteService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une visite' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiBody({ type: UpdateVisiteDto })
  @ApiResponse({ status: 200, description: 'Visite mise à jour' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  update(@Param('id') id: string, @Body() updateVisiteDto: UpdateVisiteDto) {
    return this.visiteService.update(id, updateVisiteDto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une visite' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  @ApiResponse({ status: 400, description: 'Statut invalide' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    return this.visiteService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une visite' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiResponse({ status: 200, description: 'Visite supprimée' })
  @ApiResponse({ status: 404, description: 'Visite non trouvée' })
  remove(@Param('id') id: string) {
    return this.visiteService.remove(id);
  }
}
