import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('Evaluation')
@Controller('evaluation')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle évaluation' })
  @ApiResponse({ status: 201, description: 'Évaluation créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou auto-évaluation' })
  @ApiBody({ type: CreateEvaluationDto })
  create(@Body() createEvaluationDto: CreateEvaluationDto) {
    return this.evaluationService.create(createEvaluationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les évaluations ou filtrer par userId/evaluatorId' })
  @ApiQuery({ name: 'userId', required: false, description: 'ID de l\'utilisateur évalué' })
  @ApiQuery({ name: 'evaluatorId', required: false, description: 'ID de l\'évaluateur' })
  @ApiResponse({ status: 200, description: 'Liste des évaluations' })
  findAll(@Query('userId') userId?: string, @Query('evaluatorId') evaluatorId?: string) {
    if (userId) {
      return this.evaluationService.findByUserId(userId);
    }
    if (evaluatorId) {
      return this.evaluationService.findByEvaluatorId(evaluatorId);
    }
    return this.evaluationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une évaluation par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'évaluation' })
  @ApiResponse({ status: 200, description: 'Évaluation trouvée' })
  @ApiResponse({ status: 404, description: 'Évaluation non trouvée' })
  findOne(@Param('id') id: string) {
    return this.evaluationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une évaluation' })
  @ApiParam({ name: 'id', description: 'ID de l\'évaluation' })
  @ApiBody({ type: UpdateEvaluationDto })
  @ApiResponse({ status: 200, description: 'Évaluation mise à jour' })
  @ApiResponse({ status: 404, description: 'Évaluation non trouvée' })
  update(@Param('id') id: string, @Body() updateEvaluationDto: UpdateEvaluationDto) {
    return this.evaluationService.update(id, updateEvaluationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une évaluation' })
  @ApiParam({ name: 'id', description: 'ID de l\'évaluation' })
  @ApiResponse({ status: 200, description: 'Évaluation supprimée' })
  @ApiResponse({ status: 404, description: 'Évaluation non trouvée' })
  remove(@Param('id') id: string) {
    return this.evaluationService.remove(id);
  }
}
