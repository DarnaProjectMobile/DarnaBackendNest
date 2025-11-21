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
} from '@nestjs/common';
import { AnnoncesService } from './annonces.service';
import { CreateAnnonceDto } from './dto/create-annonce.dto';
import { UpdateAnnonceDto } from './dto/update-annonce.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import type { Request } from 'express';
import { UserDocument } from 'src/users/schemas/user.schema';
import { BookAnnonceDto } from './dto/book-annonce.dto';

@Controller('annonces')
export class AnnoncesController {
  constructor(private readonly annoncesService: AnnoncesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createAnnonceDto: CreateAnnonceDto, @Req() req: Request) {
    const user = req.user as UserDocument;
    return this.annoncesService.create(createAnnonceDto, user);
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

  // ⭐ NEW BOOKING ROUTE
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
}
