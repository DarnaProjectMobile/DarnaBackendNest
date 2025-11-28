import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AuthGuard } from '@nestjs/passport';
import { Req } from '@nestjs/common';


@ApiTags('reviews')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

 @Post()
@ApiOperation({ summary: 'Create a new review' })
create(@Body() dto: CreateReviewDto, @Req() req: any) {
  const userId = req.user.userId; // 🔥 from JWT payload
  return this.reviewsService.create(userId, dto);
}



  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update review by ID' })
  update(@Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete review by ID' })
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
