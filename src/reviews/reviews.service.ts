import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(@InjectModel(Review.name) private readonly reviewModel: Model<Review>) {}

  async create(userId: string, dto: CreateReviewDto) {
  const review = new this.reviewModel({
    rating: dto.rating,
    comment: dto.comment,
    user: userId, // 🔥 assigned automatically
  });

  return review.save();
}



  async findAll() {
  return this.reviewModel
    .find()
    .populate('user', 'name username email');
}

async findOne(id: string) {
  const review = await this.reviewModel
    .findById(id)
    .populate('user', 'name username email');

  if (!review) throw new NotFoundException(`Review with ID ${id} not found`);
  return review;
}

async update(id: string, dto: UpdateReviewDto) {
  const updated = await this.reviewModel
    .findByIdAndUpdate(id, dto, { new: true })
    .populate('user', 'name username email');

  if (!updated) throw new NotFoundException(`Review with ID ${id} not found`);
  return updated;
}


  async remove(id: string) {
    const deleted = await this.reviewModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException(`Review with ID ${id} not found`);
    return { message: 'Review deleted successfully' };
  }
}
