import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Report } from './entities/report.entity';

@Injectable()
export class ReportsService {
  constructor(@InjectModel(Report.name) private readonly reportModel: Model<Report>) {}

  async create(userId: string, dto: CreateReportDto) {
    const report = new this.reportModel({
      reason: dto.reason,
      details: dto.details,
      user: userId,
    });

    return report.save();
  }

  async findAll() {
    return this.reportModel.find().populate('user', 'name email role');
  }

  async findOne(id: string) {
    const report = await this.reportModel.findById(id).populate('user', 'name email role');
    if (!report) throw new NotFoundException(`Report with ID ${id} not found`);
    return report;
  }

  async update(id: string, dto: UpdateReportDto) {
    const updated = await this.reportModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('user', 'name email role');

    if (!updated) throw new NotFoundException(`Report with ID ${id} not found`);
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.reportModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException(`Report with ID ${id} not found`);

    return { message: 'Report deleted successfully' };
  }
}
