import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReviewsSummaryService } from './reviews-summary.service';

@ApiTags('reviews-summary')
@Controller('reviews/summary')
export class ReviewsSummaryController {
    constructor(private readonly summaryService: ReviewsSummaryService) { }

    @Get(':propertyId')
    @ApiOperation({ summary: 'Generate AI-style summary for reviews of a property' })
    async getSummary(@Param('propertyId') propertyId: string) {
        return this.summaryService.generateSummary(propertyId);
    }
}
