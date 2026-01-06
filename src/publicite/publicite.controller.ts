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
import type { Request } from 'express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('publicites')
@Controller('publicites')
export class PubliciteController {
  constructor(
    private readonly service: PubliciteService,
    private cloudinaryService: CloudinaryService
  ) {}

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
  @UseInterceptors(FileInterceptor('image', {
    storage: require('multer').memoryStorage(), // Use memory storage instead of disk
  }))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) {
      return { error: 'No image uploaded' };
    }

    // Upload to Cloudinary
    const result = await this.cloudinaryService.uploadImage(file, 'publicites');
    
    return {
      message: 'Image uploaded successfully',
      imageUrl: result.secure_url, // Use Cloudinary URL
      publicId: result.public_id, // Return public ID for potential future operations
    };
  }
}