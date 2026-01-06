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
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('Logement')
@Controller('logement')
@UseGuards(JwtAuthGuard)
export class LogementController {
  constructor(
    private readonly logementService: LogementService,
    private cloudinaryService: CloudinaryService
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un nouveau logement (Colocataire uniquement)' })
  @ApiResponse({ status: 201, description: 'Logement créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @UseInterceptors(FilesInterceptor('images', 10, {
    storage: require('multer').memoryStorage(), // Use memory storage instead of disk
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
  }))
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createLogementDto: CreateLogementDto, 
    @CurrentUser() user: any
  ) {
    // Upload images to Cloudinary and get URLs
    if (files && files.length > 0) {
      const imageUrls: string[] = [];
      for (const file of files) {
        const result = await this.cloudinaryService.uploadImage(file, 'logement');
        imageUrls.push(result.secure_url);
      }
      createLogementDto.images = imageUrls;
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
  @UseInterceptors(FilesInterceptor('images', 10, {
    storage: require('multer').memoryStorage(), // Use memory storage instead of disk
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
  }))
  async update(
    @Param('id') id: string, 
    @UploadedFiles() files: Express.Multer.File[],
    @Body() updateLogementDto: UpdateLogementDto
  ) {
    // Upload images to Cloudinary and get URLs
    if (files && files.length > 0) {
      const imageUrls: string[] = [];
      for (const file of files) {
        const result = await this.cloudinaryService.uploadImage(file, 'logement');
        imageUrls.push(result.secure_url);
      }
      updateLogementDto.images = imageUrls;
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