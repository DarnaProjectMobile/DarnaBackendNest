import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/common/current-user.decorator';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorators';
import { Role } from '../auth/common/role.enum';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(@Body() createReviewDto: CreateReviewDto, @CurrentUser() user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.reviewsService.create(createReviewDto, user.userId);
  }

  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }

  // 🧑‍💼 CÔTÉ COLLOCATOR : consulter tous les feedbacks reçus
  @Get('me/feedbacks')
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator)
  getMyFeedbacks(@CurrentUser() user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.reviewsService.findByCollectorId(user.userId);
  }

  // 🧑‍💼 CÔTÉ COLLOCATOR : voir son score de réputation agrégé
  @Get('me/reputation')
  @UseGuards(RolesGuard)
  @Roles(Role.Collocator)
  getMyReputation(@CurrentUser() user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.reviewsService.getCollectorReputation(user.userId);
  }
}
