import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('reviews')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  async create(@Body() dto: CreateReviewDto, @Req() req: any) {
    const userId = req.user.userId; // 🔥 from JWT payload
    const result = await this.reviewsService.create(userId, dto);
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews with optional filtering' })
  @ApiQuery({ name: 'property', required: false, description: 'Filter by property ID' })
  @ApiQuery({ name: 'user', required: false, description: 'Filter by user ID' })
  async findAll(@Query('property') property?: string, @Query('user') user?: string) {
    const result = await this.reviewsService.findAll(property, user);
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  async findOne(@Param('id') id: string) {
    const result = await this.reviewsService.findOne(id);
    return result;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update review by ID' })
  async update(@Param('id') id: string, @Body() dto: UpdateReviewDto) {
    const result = await this.reviewsService.update(id, dto);
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete review by ID' })
  async remove(@Param('id') id: string) {
    const result = await this.reviewsService.remove(id);
    return result;
  }
}
