import { Controller, Post, Body } from '@nestjs/common';
import { CreateApireviewDto } from './dto/create-apireview.dto';
import { ApireviewsService } from './apireviews.service';

@Controller('api-reviews')
export class ApireviewsController {
  constructor(private readonly apireviewsService: ApireviewsService) {}

  @Post()
  async create(@Body() dto: CreateApireviewDto) {
    const result = await this.apireviewsService.analyzeReview(dto.text);

    return {
      propertyId: dto.propertyId,
      authorId: dto.authorId,
      ...result,
    };
  }
}
