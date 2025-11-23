import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PubliciteService } from './publicite.service';
import { CreatePubliciteDto } from './dto/create-publicite.dto';
import { UpdatePubliciteDto } from './dto/update-publicite.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Publicite')
@Controller('publicite')
export class PubliciteController {
  constructor(private readonly publiciteService: PubliciteService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle publicité' })
  @ApiResponse({ status: 201, description: 'Publicité créée avec succès' })
  create(@Body() createPubliciteDto: CreatePubliciteDto) {
    return this.publiciteService.create(createPubliciteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les publicités' })
  @ApiResponse({ status: 200, description: 'Liste des publicités' })
  findAll() {
    return this.publiciteService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Récupérer les publicités actives' })
  @ApiResponse({ status: 200, description: 'Liste des publicités actives' })
  findActive() {
    return this.publiciteService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une publicité par ID' })
  @ApiParam({ name: 'id', description: 'ID de la publicité' })
  @ApiResponse({ status: 200, description: 'Publicité trouvée' })
  @ApiResponse({ status: 404, description: 'Publicité non trouvée' })
  findOne(@Param('id') id: string) {
    return this.publiciteService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une publicité' })
  @ApiParam({ name: 'id', description: 'ID de la publicité' })
  @ApiResponse({ status: 200, description: 'Publicité mise à jour' })
  @ApiResponse({ status: 404, description: 'Publicité non trouvée' })
  update(@Param('id') id: string, @Body() updatePubliciteDto: UpdatePubliciteDto) {
    return this.publiciteService.update(id, updatePubliciteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une publicité' })
  @ApiParam({ name: 'id', description: 'ID de la publicité' })
  @ApiResponse({ status: 200, description: 'Publicité supprimée' })
  @ApiResponse({ status: 404, description: 'Publicité non trouvée' })
  remove(@Param('id') id: string) {
    return this.publiciteService.remove(id);
  }
}
