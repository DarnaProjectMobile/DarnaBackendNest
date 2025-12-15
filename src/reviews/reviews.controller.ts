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
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // -------------------------------------------------------
  // CREATE (Protected)
  // -------------------------------------------------------
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  async create(@Body() dto: CreateReviewDto, @Req() req: any) {
    const userId = req.user.userId;
    return await this.reviewsService.create(userId, dto);
  }

  // -------------------------------------------------------
  // GET ALL (Public)
  // -------------------------------------------------------
  @Get()
  @ApiOperation({ summary: 'Get all reviews with optional filtering' })
  @ApiQuery({ name: 'property', required: false, description: 'Filter by property ID' })
  @ApiQuery({ name: 'user', required: false, description: 'Filter by user ID' })
  async findAll(@Query('property') property?: string, @Query('user') user?: string) {
    return await this.reviewsService.findAll(property, user);
  }

  // -------------------------------------------------------
  // GET ONE (Public)
  // -------------------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  async findOne(@Param('id') id: string) {
    return await this.reviewsService.findOne(id);
  }

  // -------------------------------------------------------
  // UPDATE (Protected)
  // -------------------------------------------------------
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @Patch(':id')
  @ApiOperation({ summary: 'Update review by ID' })
  async update(@Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return await this.reviewsService.update(id, dto);
  }

  // -------------------------------------------------------
  // DELETE (Protected)
  // -------------------------------------------------------
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete review by ID' })
  async remove(@Param('id') id: string) {
    return await this.reviewsService.remove(id);
  }
}
