import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req
} from '@nestjs/common';

import { PubliciteService } from './publicite.service';
import { CreatePubliciteDto } from './dto/create-publicite.dto';
import { UpdatePubliciteDto } from './dto/update-publicite.dto';

import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/role.guard';

import { Roles } from 'src/auth/roles.decorators';
import { Role } from 'src/auth/common/role.enum';

@Controller('publicite')
export class PubliciteController {
  constructor(private readonly publiciteService: PubliciteService) {}

  // ✅ CREATE PUBLICITÉ (SPONSOR ONLY)
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Sponsor)
  create(@Body() dto: CreatePubliciteDto, @Req() req) {
    // Passe le userId au service pour lier le sponsor
    return this.publiciteService.create(dto, req.user.userId);
  }

  // ✅ GET ALL ACTIVE PUBLICITÉS
  @Get()
  findAll() {
    return this.publiciteService.findAllActive();
  }

  // ✅ GET ONE PUBLICITÉ
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.publiciteService.findOne(id);
  }

  // ✅ UPDATE PUBLICITÉ (SPONSOR ONLY, OWNER ONLY)
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Sponsor)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePubliciteDto,
    @Req() req
  ) {
    return this.publiciteService.update(id, dto, req.user.userId);
  }

  // ✅ DELETE PUBLICITÉ (SPONSOR ONLY, OWNER ONLY)
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Sponsor)
  remove(@Param('id') id: string, @Req() req) {
    return this.publiciteService.remove(id, req.user.userId);
  }
}
