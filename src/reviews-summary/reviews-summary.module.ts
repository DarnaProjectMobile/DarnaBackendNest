import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from '../reviews/entities/review.entity';
import { ReviewsSummaryService } from './reviews-summary.service';
import { ReviewsSummaryController } from './reviews-summary.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }])
    ],
    controllers: [ReviewsSummaryController],
    providers: [ReviewsSummaryService],
})
export class ReviewsSummaryModule { }
