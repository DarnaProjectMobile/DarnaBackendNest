import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { LogementService } from './logement.service';
import { CreateLogementDto } from './dto/create-logement.dto';
import { UpdateLogementDto } from './dto/update-logement.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorators';
import { CurrentUser } from '../auth/common/current-user.decorator';
import { Role } from '../auth/common/role.enum';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Configure multer storage for logement images
const logementImageStorage = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = join(process.cwd(), 'uploads', 'logement');
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extension = extname(file.originalname);
      cb(null, uniqueSuffix + extension);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      cb(new Error('Only image files are allowed!'), false);
    } else {
      cb(null, true);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
};

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
  @UseInterceptors(FilesInterceptor('images', 10, logementImageStorage))
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createLogementDto: CreateLogementDto, 
    @CurrentUser() user: any
  ) {
    // Add image paths to the DTO if files were uploaded
    if (files && files.length > 0) {
      const imagePaths = files.map(file => `/uploads/logement/${file.filename}`);
      createLogementDto.images = imagePaths;
    }
    
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
  @UseInterceptors(FilesInterceptor('images', 10, logementImageStorage))
  async update(
    @Param('id') id: string, 
    @UploadedFiles() files: Express.Multer.File[],
    @Body() updateLogementDto: UpdateLogementDto
  ) {
    // Add image paths to the DTO if files were uploaded
    if (files && files.length > 0) {
      const imagePaths = files.map(file => `/uploads/logement/${file.filename}`);
      updateLogementDto.images = imagePaths;
    }
    
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