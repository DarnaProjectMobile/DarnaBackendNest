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
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Multer storage config
const annonceImageStorage = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = join(process.cwd(), 'uploads', 'annonces');
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
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};

@Controller('annonces')
export class AnnoncesController {
  constructor(private readonly annoncesService: AnnoncesService) {}

  // ============================
  // CREATE ANNONCE
  // ============================
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10, annonceImageStorage))
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createAnnonceDto: CreateAnnonceDto,
    @Req() req: Request,
  ) {
    const user = req.user as UserDocument;

    let imagePaths: string[] = [];

    // Case 1: Files uploaded
    if (files?.length > 0) {
      imagePaths = files.map(file => `/uploads/annonces/${file.filename}`);
    }

    // Case 2: User provided image URLs in JSON
    if (!files?.length && createAnnonceDto.images?.length) {
      imagePaths = createAnnonceDto.images;
    }

    return this.annoncesService.create(createAnnonceDto, user, imagePaths);
  }

  // ============================
  // GET ALL
  // ============================
  @Get()
  findAll() {
    return this.annoncesService.findAll();
  }

  // ============================
  // GET ONE
  // ============================
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.annoncesService.findOne(id);
  }

  // ============================
  // UPDATE
  // ============================
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 10, annonceImageStorage))
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() updateAnnonceDto: UpdateAnnonceDto,
    @Req() req: Request,
  ) {
    const user = req.user as UserDocument;

    let imagePaths: string[] | undefined = undefined;

    // Case 1: Files uploaded
    if (files?.length > 0) {
      imagePaths = files.map(file => `/uploads/annonces/${file.filename}`);
    }

    // Case 2: Image URLs provided
    if (!files?.length && updateAnnonceDto.images?.length) {
      imagePaths = updateAnnonceDto.images;
    }

    return this.annoncesService.update(id, updateAnnonceDto, user, imagePaths);
  }

  // ============================
  // DELETE
  // ============================
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as UserDocument;
    return this.annoncesService.remove(id, user);
  }

  // ============================
  // BOOK ANNONCE
  // ============================
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

  // ============================
  // ACCEPT / REJECT BOOKING
  // ============================
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
