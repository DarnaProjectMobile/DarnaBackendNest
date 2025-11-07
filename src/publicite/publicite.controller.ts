import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PubliciteService } from './publicite.service';
import { CreatePubliciteDto } from './dto/create-publicite.dto';
import { UpdatePubliciteDto } from './dto/update-publicite.dto';

@Controller('publicite')
export class PubliciteController {
  constructor(private readonly publiciteService: PubliciteService) {}

  @Post()
  create(@Body() createPubliciteDto: CreatePubliciteDto) {
    return this.publiciteService.create(createPubliciteDto);
  }

  @Get()
  findAll() {
    return this.publiciteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.publiciteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePubliciteDto: UpdatePubliciteDto) {
    return this.publiciteService.update(+id, updatePubliciteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.publiciteService.remove(+id);
  }
}
