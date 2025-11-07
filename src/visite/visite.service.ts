import { Injectable } from '@nestjs/common';
import { CreateVisiteDto } from './dto/create-visite.dto';
import { UpdateVisiteDto } from './dto/update-visite.dto';

@Injectable()
export class VisiteService {
  create(createVisiteDto: CreateVisiteDto) {
    return 'This action adds a new visite';
  }

  findAll() {
    return `This action returns all visite`;
  }

  findOne(id: number) {
    return `This action returns a #${id} visite`;
  }

  update(id: number, updateVisiteDto: UpdateVisiteDto) {
    return `This action updates a #${id} visite`;
  }

  remove(id: number) {
    return `This action removes a #${id} visite`;
  }
}
