import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { LogementService } from './logement.service';
import { CreateLogementDto } from './dto/create-logement.dto';
import { UpdateLogementDto } from './dto/update-logement.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorators';
import { CurrentUser } from '../auth/common/current-user.decorator';
import { Role } from '../auth/common/role.enum';

@ApiTags('Logement')
@Controller('logement')
@UseGuards(JwtAuthGuard)
export class LogementController {
  constructor(private readonly logementService: LogementService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un nouveau logement (Colocataire uniquement)' })
  @ApiResponse({ status: 201, description: 'Logement créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  create(@Body() createLogementDto: CreateLogementDto, @CurrentUser() user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.logementService.create(createLogementDto, user.userId);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer tous les logements' })
  @ApiResponse({ status: 200, description: 'Liste des logements' })
  findAll() {
    return this.logementService.findAll();
  }

  @Get('my-logements')
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer mes logements (Colocataire uniquement)' })
  @ApiResponse({ status: 200, description: 'Liste de mes logements' })
  getMyLogements(@CurrentUser() user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.logementService.findByOwnerId(user.userId);
  }

  @Get('annonce/:annonceId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer un logement par ID d\'annonce' })
  @ApiParam({ name: 'annonceId', description: 'ID de l\'annonce' })
  @ApiResponse({ status: 200, description: 'Logement trouvé' })
  @ApiResponse({ status: 404, description: 'Logement non trouvé' })
  findByAnnonceId(@Param('annonceId') annonceId: string) {
    return this.logementService.findByAnnonceId(annonceId);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer un logement par ID' })
  @ApiParam({ name: 'id', description: 'ID du logement' })
  @ApiResponse({ status: 200, description: 'Logement trouvé' })
  @ApiResponse({ status: 404, description: 'Logement non trouvé' })
  findOne(@Param('id') id: string) {
    return this.logementService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour un logement (Colocataire uniquement)' })
  @ApiParam({ name: 'id', description: 'ID du logement' })
  @ApiResponse({ status: 200, description: 'Logement mis à jour' })
  @ApiResponse({ status: 404, description: 'Logement non trouvé' })
  update(@Param('id') id: string, @Body() updateLogementDto: UpdateLogementDto) {
    return this.logementService.update(id, updateLogementDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un logement (Colocataire uniquement)' })
  @ApiParam({ name: 'id', description: 'ID du logement' })
  @ApiResponse({ status: 200, description: 'Logement supprimé' })
  @ApiResponse({ status: 404, description: 'Logement non trouvé' })
  remove(@Param('id') id: string) {
    return this.logementService.remove(id);
  }
}









