import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(@InjectModel(Review.name) private readonly reviewModel: Model<Review>) {}

  async create(createReviewDto: CreateReviewDto) {
    try {
      const review = new this.reviewModel({
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
        user: createReviewDto.userId, // link existing user
      });
      return await review.save();
    } catch (error) {
      console.error('❌ Create review error:', error);
      throw error;
    }
  }

  async findAll() {
    return this.reviewModel.find().populate('user', 'name email role');
  }

  async findOne(id: string) {
    const review = await this.reviewModel.findById(id).populate('user', 'name email role');
    if (!review) throw new NotFoundException(`Review with ID ${id} not found`);
    return review;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    const updated = await this.reviewModel
      .findByIdAndUpdate(id, updateReviewDto, { new: true })
      .populate('user', 'name email role');
    if (!updated) throw new NotFoundException(`Review with ID ${id} not found`);
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.reviewModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException(`Review with ID ${id} not found`);
    return { message: 'Review deleted successfully' };
  }
}
