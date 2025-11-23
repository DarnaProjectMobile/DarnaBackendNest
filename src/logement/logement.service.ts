import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Logement, LogementDocument } from './schemas/logement.schema';
import { CreateLogementDto } from './dto/create-logement.dto';
import { UpdateLogementDto } from './dto/update-logement.dto';

@Injectable()
export class LogementService {
  constructor(
    @InjectModel(Logement.name) private logementModel: Model<LogementDocument>,
  ) {}

  async create(createLogementDto: CreateLogementDto, ownerId: string): Promise<Logement> {
    // Vérifier si un logement avec cet annonceId existe déjà
    const existing = await this.logementModel.findOne({ annonceId: createLogementDto.annonceId }).exec();
    if (existing) {
      throw new BadRequestException('Un logement avec cet ID d\'annonce existe déjà');
    }

    const logement = new this.logementModel({
      ...createLogementDto,
      ownerId,
    });
    return logement.save();
  }

  async findAll(): Promise<Logement[]> {
    return this.logementModel.find().exec();
  }

  async findOne(id: string): Promise<Logement> {
    const logement = await this.logementModel.findById(id).exec();
    if (!logement) {
      throw new NotFoundException(`Logement with ID ${id} not found`);
    }
    return logement;
  }

  async findByAnnonceId(annonceId: string): Promise<Logement> {
    const logement = await this.logementModel.findOne({ annonceId }).exec();
    if (!logement) {
      throw new NotFoundException(`Logement with annonceId ${annonceId} not found`);
    }
    return logement;
  }

  async findByOwnerId(ownerId: string): Promise<Logement[]> {
    return this.logementModel.find({ ownerId }).exec();
  }

  async update(id: string, updateLogementDto: UpdateLogementDto): Promise<Logement> {
    const updatedLogement = await this.logementModel
      .findByIdAndUpdate(id, updateLogementDto, { new: true })
      .exec();

    if (!updatedLogement) {
      throw new NotFoundException(`Logement with ID ${id} not found`);
    }

    return updatedLogement;
  }

  async remove(id: string): Promise<void> {
    const result = await this.logementModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Logement with ID ${id} not found`);
    }
  }
}









