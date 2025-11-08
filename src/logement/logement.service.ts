import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Logement, LogementDocument } from './entities/logement.entity';
import { CreateLogementDto } from './dto/create-logement.dto';
import { UpdateLogementDto } from './dto/update-logement.dto';

@Injectable()
export class LogementService {
  constructor(
    @InjectModel(Logement.name)
    private logementModel: Model<LogementDocument>,
  ) {}

  async create(createLogementDto: CreateLogementDto): Promise<Logement> {
    const createdLogement = new this.logementModel(createLogementDto);
    return createdLogement.save();
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

  async findByOwnerId(ownerId: string): Promise<Logement[]> {
    return this.logementModel.find({ ownerId }).exec();
  }

  async findAvailable(): Promise<Logement[]> {
    return this.logementModel.find({ available: true }).exec();
  }

  async findByCity(city: string): Promise<Logement[]> {
    return this.logementModel.find({ city }).exec();
  }

  async update(
    id: string,
    updateLogementDto: UpdateLogementDto,
  ): Promise<Logement> {
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
