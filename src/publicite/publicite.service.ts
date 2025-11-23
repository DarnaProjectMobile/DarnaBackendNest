import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Publicite, PubliciteDocument } from './schemas/publicite.schema';
import { CreatePubliciteDto } from './dto/create-publicite.dto';
import { UpdatePubliciteDto } from './dto/update-publicite.dto';

@Injectable()
export class PubliciteService {
  constructor(
    @InjectModel(Publicite.name) private publiciteModel: Model<PubliciteDocument>,
  ) {}

  async create(createPubliciteDto: CreatePubliciteDto): Promise<Publicite> {
    const publicite = new this.publiciteModel(createPubliciteDto);
    return publicite.save();
  }

  async findAll(): Promise<Publicite[]> {
    return this.publiciteModel.find().exec();
  }

  async findActive(): Promise<Publicite[]> {
    const now = new Date();
    return this.publiciteModel
      .find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .exec();
  }

  async findOne(id: string): Promise<Publicite> {
    const publicite = await this.publiciteModel.findById(id).exec();
    if (!publicite) {
      throw new NotFoundException(`Publicite with ID ${id} not found`);
    }
    return publicite;
  }

  async update(id: string, updatePubliciteDto: UpdatePubliciteDto): Promise<Publicite> {
    const updatedPublicite = await this.publiciteModel
      .findByIdAndUpdate(id, updatePubliciteDto, { new: true })
      .exec();

    if (!updatedPublicite) {
      throw new NotFoundException(`Publicite with ID ${id} not found`);
    }
    return updatedPublicite;
  }

  async incrementViews(id: string): Promise<Publicite> {
    const publicite = await this.publiciteModel.findById(id).exec();
    if (!publicite) {
      throw new NotFoundException(`Publicite with ID ${id} not found`);
    }
    publicite.views = (publicite.views || 0) + 1;
    return publicite.save();
  }

  async incrementClicks(id: string): Promise<Publicite> {
    const publicite = await this.publiciteModel.findById(id).exec();
    if (!publicite) {
      throw new NotFoundException(`Publicite with ID ${id} not found`);
    }
    publicite.clicks = (publicite.clicks || 0) + 1;
    return publicite.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.publiciteModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Publicite with ID ${id} not found`);
    }
  }
}
