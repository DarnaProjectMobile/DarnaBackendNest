import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Annonce, AnnonceDocument } from './schemas/annonce.schema';
import { CreateAnnonceDto } from './dto/create-annonce.dto';
import { UpdateAnnonceDto } from './dto/update-annonce.dto';

@Injectable()
export class AnnoncesService {
  constructor(
    @InjectModel(Annonce.name) private annonceModel: Model<AnnonceDocument>,
  ) {}

  async create(createAnnonceDto: CreateAnnonceDto, ownerId: string): Promise<Annonce> {
    const existing = await this.annonceModel.findOne({ name: createAnnonceDto.name }).exec();
    if (existing) {
      throw new BadRequestException('Une annonce avec ce nom existe déjà');
    }

    const annonce = new this.annonceModel({
      ...createAnnonceDto,
      ownerId,
    });
    return annonce.save();
  }

  async findAll(): Promise<Annonce[]> {
    return this.annonceModel.find().exec();
  }

  async findOne(id: string): Promise<Annonce> {
    const annonce = await this.annonceModel.findById(id).exec();
    if (!annonce) {
      throw new NotFoundException(`Annonce with ID ${id} not found`);
    }
    return annonce;
  }

  async findByName(name: string): Promise<Annonce | null> {
    return this.annonceModel.findOne({ name }).exec();
  }

  async findByOwnerId(ownerId: string): Promise<Annonce[]> {
    return this.annonceModel.find({ ownerId }).exec();
  }

  async update(id: string, updateAnnonceDto: UpdateAnnonceDto): Promise<Annonce> {
    const updatedAnnonce = await this.annonceModel
      .findByIdAndUpdate(id, updateAnnonceDto, { new: true })
      .exec();
    if (!updatedAnnonce) {
      throw new NotFoundException(`Annonce with ID ${id} not found`);
    }
    return updatedAnnonce;
  }

  async remove(id: string): Promise<void> {
    const result = await this.annonceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Annonce with ID ${id} not found`);
    }
  }
}

