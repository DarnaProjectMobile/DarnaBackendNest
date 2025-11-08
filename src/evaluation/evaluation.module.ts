import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { Evaluation, EvaluationSchema } from './entities/evaluation.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Evaluation.name, schema: EvaluationSchema },
    ]),
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
