import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AnnoncesService } from './annonces.service';
import { CreateAnnonceDto } from './dto/create-annonce.dto';
import { UpdateAnnonceDto } from './dto/update-annonce.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorators';
import { CurrentUser } from '../auth/common/current-user.decorator';
import { Role } from '../auth/common/role.enum';

@ApiTags('Annonces')
@Controller('annonces')
@UseGuards(JwtAuthGuard)
export class AnnoncesController {
  constructor(private readonly annoncesService: AnnoncesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer une nouvelle annonce (Colocataire uniquement)' })
  @ApiResponse({ status: 201, description: 'Annonce créée avec succès' })
  create(@Body() createAnnonceDto: CreateAnnonceDto, @CurrentUser() user: any) {
    return this.annoncesService.create(createAnnonceDto, user.userId);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer toutes les annonces' })
  @ApiResponse({ status: 200, description: 'Liste des annonces' })
  findAll() {
    return this.annoncesService.findAll();
  }

  @Get('my-annonces')
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer mes annonces (Colocataire uniquement)' })
  @ApiResponse({ status: 200, description: 'Liste de mes annonces' })
  getMyAnnonces(@CurrentUser() user: any) {
    return this.annoncesService.findByOwnerId(user.userId);
  }

  @Get('name/:name')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer une annonce par nom' })
  @ApiParam({ name: 'name', description: 'Nom de l\'annonce' })
  @ApiResponse({ status: 200, description: 'Annonce trouvée' })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
  findByName(@Param('name') name: string) {
    return this.annoncesService.findByName(name);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer une annonce par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'annonce' })
  @ApiResponse({ status: 200, description: 'Annonce trouvée' })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
  findOne(@Param('id') id: string) {
    return this.annoncesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour une annonce (Colocataire uniquement)' })
  @ApiParam({ name: 'id', description: 'ID de l\'annonce' })
  @ApiResponse({ status: 200, description: 'Annonce mise à jour' })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
  update(@Param('id') id: string, @Body() updateAnnonceDto: UpdateAnnonceDto) {
    return this.annoncesService.update(id, updateAnnonceDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer une annonce (Colocataire uniquement)' })
  @ApiParam({ name: 'id', description: 'ID de l\'annonce' })
  @ApiResponse({ status: 200, description: 'Annonce supprimée' })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
  remove(@Param('id') id: string) {
    return this.annoncesService.remove(id);
  }
}

