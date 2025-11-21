import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Visite, VisiteDocument } from './schemas/visite.schema';
import { CreateVisiteDto } from './dto/create-visite.dto';
import { UpdateVisiteDto } from './dto/update-visite.dto';

@Injectable()
export class VisiteService {
  constructor(
    @InjectModel(Visite.name) private visiteModel: Model<VisiteDocument>,
  ) {}

  async create(createVisiteDto: CreateVisiteDto, userId: string): Promise<Visite> {
    const visite = new this.visiteModel({
      ...createVisiteDto,
      userId,
      dateVisite: new Date(createVisiteDto.dateVisite),
      status: 'pending',
    });
    return visite.save();
  }

  async findAll(): Promise<Visite[]> {
    return this.visiteModel.find().exec();
  }

  async findOne(id: string): Promise<Visite> {
    const visite = await this.visiteModel.findById(id).exec();
    if (!visite) {
      throw new NotFoundException(`Visite with ID ${id} not found`);
    }
    return visite;
  }

  async findByUserId(userId: string): Promise<Visite[]> {
    return this.visiteModel.find({ userId }).sort({ dateVisite: -1 }).exec();
  }

  async findByLogementId(logementId: string): Promise<Visite[]> {
    return this.visiteModel
      .find({ logementId })
      .sort({ dateVisite: -1 })
      .exec();
  }

  async update(id: string, updateVisiteDto: UpdateVisiteDto): Promise<Visite> {
    const updateData: any = { ...updateVisiteDto };
    
    if (updateVisiteDto.dateVisite) {
      updateData.dateVisite = new Date(updateVisiteDto.dateVisite);
    }

    const updatedVisite = await this.visiteModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedVisite) {
      throw new NotFoundException(`Visite with ID ${id} not found`);
    }

    return updatedVisite;
  }

  async updateStatus(
    id: string,
    status: string,
  ): Promise<Visite> {
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    const updatedVisite = await this.visiteModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();

    if (!updatedVisite) {
      throw new NotFoundException(`Visite with ID ${id} not found`);
    }

    return updatedVisite;
  }

  async remove(id: string): Promise<void> {
    const result = await this.visiteModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Visite with ID ${id} not found`);
    }
  }
}
