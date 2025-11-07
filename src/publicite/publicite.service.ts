import { Injectable } from '@nestjs/common';
import { CreatePubliciteDto } from './dto/create-publicite.dto';
import { UpdatePubliciteDto } from './dto/update-publicite.dto';

@Injectable()
export class PubliciteService {
  create(createPubliciteDto: CreatePubliciteDto) {
    return 'This action adds a new publicite';
  }

  findAll() {
    return `This action returns all publicite`;
  }

  findOne(id: number) {
    return `This action returns a #${id} publicite`;
  }

  update(id: number, updatePubliciteDto: UpdatePubliciteDto) {
    return `This action updates a #${id} publicite`;
  }

  remove(id: number) {
    return `This action removes a #${id} publicite`;
  }
}
