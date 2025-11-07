import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VisiteService } from './visite.service';
import { CreateVisiteDto } from './dto/create-visite.dto';
import { UpdateVisiteDto } from './dto/update-visite.dto';

@Controller('visite')
export class VisiteController {
  constructor(private readonly visiteService: VisiteService) {}

  @Post()
  create(@Body() createVisiteDto: CreateVisiteDto) {
    return this.visiteService.create(createVisiteDto);
  }

  @Get()
  findAll() {
    return this.visiteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visiteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVisiteDto: UpdateVisiteDto) {
    return this.visiteService.update(+id, updateVisiteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.visiteService.remove(+id);
  }
}
