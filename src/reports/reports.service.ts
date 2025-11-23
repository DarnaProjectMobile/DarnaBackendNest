import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
  ) {}

  async create(createReportDto: CreateReportDto, reporterId: string): Promise<Report> {
    const report = new this.reportModel({
      ...createReportDto,
      reporterId,
      status: 'pending',
    });
    return report.save();
  }

  async findAll(): Promise<Report[]> {
    return this.reportModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByStatus(status: string): Promise<Report[]> {
    return this.reportModel.find({ status }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportModel.findById(id).exec();
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
    return report;
  }

  async update(id: string, updateReportDto: UpdateReportDto): Promise<Report> {
    const updatedReport = await this.reportModel
      .findByIdAndUpdate(id, updateReportDto, { new: true })
      .exec();

    if (!updatedReport) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return updatedReport;
  }

  async remove(id: string): Promise<void> {
    const result = await this.reportModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
  }
}
