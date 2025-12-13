import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { AnnoncesService } from './annonces.service';
import { CreateAnnonceDto } from './dto/create-annonce.dto';
import { UpdateAnnonceDto } from './dto/update-annonce.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import type { Request } from 'express';
import { UserDocument } from 'src/users/schemas/user.schema';
import { BookAnnonceDto } from './dto/book-annonce.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiConsumes, ApiTags, ApiBody } from '@nestjs/swagger';

@ApiTags('Annonces')
@Controller('annonces')
export class AnnoncesController {
  constructor(private readonly annoncesService: AnnoncesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Array of house images (interior or exterior). Minimum 1 image, maximum 5 images.',
          minItems: 1,
          maxItems: 5,
        },
        title: { type: 'string', example: 'Villa S+3' },
        description: { type: 'string', example: 'A beautiful villa located in Ariana.' },
        type: { type: 'string', enum: ['S', 'S+1', 'S+2', 'S+3', 'S+4', 'Chambre'], example: 'S+3' },
        location: { type: 'string', example: 'Ariana, Tunis' },
        price: { type: 'number', example: 1200 },
        nbrCollocateurMax: { type: 'number', example: 4 },
        nbrCollocateurActuel: { type: 'number', example: 1 },
        startDate: { type: 'string', format: 'date-time', example: '2024-07-01T00:00:00.000Z' },
        endDate: { type: 'string', format: 'date-time', example: '2024-12-31T00:00:00.000Z' },
      },
      required: ['images', 'title', 'description', 'type', 'location', 'price', 'nbrCollocateurMax', 'nbrCollocateurActuel', 'startDate', 'endDate'],
    },
  })
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: diskStorage({
        destination: './uploads/annonces',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = extname(file.originalname);
          cb(null, uniqueSuffix + extension);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(new BadRequestException('Only image files are allowed!'), false);
        } else {
          cb(null, true);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
      },
    }),
  )
  async create(
    @Body() createAnnonceDto: CreateAnnonceDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    const user = req.user as UserDocument;
    
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    if (files.length > 5) {
      throw new BadRequestException('Maximum 5 images allowed');
    }

    return this.annoncesService.createWithImageVerification(
      createAnnonceDto,
      files,
      user,
    );
  }

  @Get()
  findAll() {
    return this.annoncesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.annoncesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAnnonceDto: UpdateAnnonceDto,
    @Req() req: Request,
  ) {
    const user = req.user as UserDocument;
    return this.annoncesService.update(id, updateAnnonceDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as UserDocument;
    return this.annoncesService.remove(id, user);
  }

  // ⭐ Book attending list
  @UseGuards(JwtAuthGuard)
  @Post(':id/book')
  bookAnnonce(
    @Param('id') id: string,
    @Body() dto: BookAnnonceDto,
    @Req() req: Request,
  ) {
    const user = req.user as UserDocument;
    return this.annoncesService.bookAnnonce(id, dto, user);
  }

  // ⭐ Accept/reject booking
  @UseGuards(JwtAuthGuard)
  @Post(':id/booking/:bookingId/respond')
  acceptBooking(
    @Param('id') id: string,
    @Param('bookingId') bookingId: string,
    @Query('accept') accept: string,
  ) {
    return this.annoncesService.acceptBooking(id, bookingId, accept === 'true');
  }
}
