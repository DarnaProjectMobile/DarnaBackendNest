import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Evaluation, EvaluationDocument } from './entities/evaluation.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';

@Injectable()
export class EvaluationService {
  constructor(
    @InjectModel(Evaluation.name)
    private evaluationModel: Model<EvaluationDocument>,
  ) {}

  async create(createEvaluationDto: CreateEvaluationDto): Promise<Evaluation> {
    // Vérifier qu'un utilisateur ne peut pas s'évaluer lui-même
    if (createEvaluationDto.userId === createEvaluationDto.evaluatorId) {
      throw new BadRequestException('You cannot evaluate yourself');
    }

    const createdEvaluation = new this.evaluationModel(createEvaluationDto);
    return createdEvaluation.save();
  }

  async findAll(): Promise<Evaluation[]> {
    return this.evaluationModel.find().exec();
  }

  async findOne(id: string): Promise<Evaluation> {
    const evaluation = await this.evaluationModel.findById(id).exec();
    if (!evaluation) {
      throw new NotFoundException(`Evaluation with ID ${id} not found`);
    }
    return evaluation;
  }

  async findByUserId(userId: string): Promise<Evaluation[]> {
    return this.evaluationModel.find({ userId }).exec();
  }

  async findByEvaluatorId(evaluatorId: string): Promise<Evaluation[]> {
    return this.evaluationModel.find({ evaluatorId }).exec();
  }

  async update(
    id: string,
    updateEvaluationDto: UpdateEvaluationDto,
  ): Promise<Evaluation> {
    const updatedEvaluation = await this.evaluationModel
      .findByIdAndUpdate(id, updateEvaluationDto, { new: true })
      .exec();

    if (!updatedEvaluation) {
      throw new NotFoundException(`Evaluation with ID ${id} not found`);
    }

    return updatedEvaluation;
  }

  async remove(id: string): Promise<void> {
    const result = await this.evaluationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Evaluation with ID ${id} not found`);
    }
  }
}
