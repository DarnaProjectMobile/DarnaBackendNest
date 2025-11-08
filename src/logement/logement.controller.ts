import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LogementService } from './logement.service';
import { CreateLogementDto } from './dto/create-logement.dto';
import { UpdateLogementDto } from './dto/update-logement.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('Logement')
@Controller('logement')
export class LogementController {
  constructor(private readonly logementService: LogementService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau logement' })
  @ApiResponse({ status: 201, description: 'Logement créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiBody({ type: CreateLogementDto })
  create(@Body() createLogementDto: CreateLogementDto) {
    return this.logementService.create(createLogementDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les logements ou filtrer par ownerId/city/available' })
  @ApiQuery({ name: 'ownerId', required: false, description: 'ID du propriétaire' })
  @ApiQuery({ name: 'city', required: false, description: 'Ville' })
  @ApiQuery({ name: 'available', required: false, description: 'Disponibilité (true)' })
  @ApiResponse({ status: 200, description: 'Liste des logements' })
  findAll(
    @Query('ownerId') ownerId?: string,
    @Query('city') city?: string,
    @Query('available') available?: string,
  ) {
    if (ownerId) {
      return this.logementService.findByOwnerId(ownerId);
    }
    if (city) {
      return this.logementService.findByCity(city);
    }
    if (available === 'true') {
      return this.logementService.findAvailable();
    }
    return this.logementService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un logement par ID' })
  @ApiParam({ name: 'id', description: 'ID du logement' })
  @ApiResponse({ status: 200, description: 'Logement trouvé' })
  @ApiResponse({ status: 404, description: 'Logement non trouvé' })
  findOne(@Param('id') id: string) {
    return this.logementService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un logement' })
  @ApiParam({ name: 'id', description: 'ID du logement' })
  @ApiBody({ type: UpdateLogementDto })
  @ApiResponse({ status: 200, description: 'Logement mis à jour' })
  @ApiResponse({ status: 404, description: 'Logement non trouvé' })
  update(@Param('id') id: string, @Body() updateLogementDto: UpdateLogementDto) {
    return this.logementService.update(id, updateLogementDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un logement' })
  @ApiParam({ name: 'id', description: 'ID du logement' })
  @ApiResponse({ status: 200, description: 'Logement supprimé' })
  @ApiResponse({ status: 404, description: 'Logement non trouvé' })
  remove(@Param('id') id: string) {
    return this.logementService.remove(id);
  }
}
