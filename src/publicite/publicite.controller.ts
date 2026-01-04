import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/role.guard';
import { Roles } from 'src/auth/roles.decorators';
import { Role } from 'src/auth/common/role.enum';
import { CreatePubliciteDto } from './dto/create-publicite.dto';
import { UpdatePubliciteDto } from './dto/update-publicite.dto';
import { PubliciteService } from './publicite.service';
import { publiciteImageUpload } from './publicite.upload.images';
import type { Request } from 'express';

@ApiTags('publicites')
@Controller('publicites')
export class PubliciteController {
  constructor(private readonly service: PubliciteService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new publicité' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Sponsor)
  create(@Body() dto: CreatePubliciteDto, @Req() req: Request) {
    return this.service.create(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all publicités' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get publicité by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update publicité by ID' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Sponsor)
  update(@Param('id') id: string, @Body() dto: UpdatePubliciteDto, @Req() req: Request) {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete publicité by ID' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Sponsor)
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.service.remove(id, req.user);
  }

  @Post('upload-image')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload image for publicité' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Sponsor)
  @UseInterceptors(FileInterceptor('image', publiciteImageUpload))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) {
      return { error: 'No image uploaded' };
    }

    // Retourner l'URL complète de l'image
    // Pour l'instant, on utilise l'URL relative qui sera servie par express.static
    const baseUrl = req.protocol + '://' + req.get('host');
    const imageUrl = `${baseUrl}/uploads/publicites/${file.filename}`;
    
    return {
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: file.filename,
    };
  }
}
