import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Annonce, AnnonceDocument } from 'src/annonces/entities/annonce.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Annonce.name) private readonly propertyModel: Model<AnnonceDocument>,
  ) { }

  // ----------------------------------------------------------------------
  // CREATE REVIEW
  // ----------------------------------------------------------------------
  async create(userId: string, dto: CreateReviewDto) {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user ID format: ${userId}`);
    }

    if (!dto.property || !isValidObjectId(dto.property)) {
      throw new BadRequestException(`Invalid or missing property ID: ${dto.property}`);
    }

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const property = await this.propertyModel.findById(dto.property);
    if (!property) {
      throw new NotFoundException(`Property not found with ID ${dto.property}`);
    }

    const review = await this.reviewModel.create({
      rating: dto.rating,
      comment: dto.comment,
      user: new Types.ObjectId(userId),
      property: new Types.ObjectId(dto.property),
      userName: dto.userName || user.username || user.email,
      propertyName: dto.propertyName || property.title,
    });

    const result: any = review.toObject();
    result.user = user;
    result.property = property;

    return this.formatReviewResponse(result);
  }


  // ----------------------------------------------------------------------
  // FIND ALL (FILTERS)
  // ----------------------------------------------------------------------
  async findAll(propertyId?: string, userId?: string) {
    const query: any = {};

    if (propertyId) {
      if (!isValidObjectId(propertyId)) {
        throw new BadRequestException(`Invalid property ID: ${propertyId}`);
      }
      query.property = new Types.ObjectId(propertyId);
    }

    if (userId) {
      if (!isValidObjectId(userId)) {
        throw new BadRequestException(`Invalid user ID: ${userId}`);
      }
      query.user = new Types.ObjectId(userId);
    }

    const reviews = await this.reviewModel
      .find(query)
      .populate('user', 'username email')
      .populate('property', 'title')
      .sort({ createdAt: -1 });

    return reviews.map(r => this.formatReviewResponse(r));
  }

  // ----------------------------------------------------------------------
  // FIND ONE
  // ----------------------------------------------------------------------
  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid review ID: ${id}`);
    }

    const review = await this.reviewModel
      .findById(id)
      .populate('user', 'username email')
      .populate('property', 'title');

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return this.formatReviewResponse(review);
  }

  // ----------------------------------------------------------------------
  // UPDATE
  // ----------------------------------------------------------------------
  async update(id: string, dto: UpdateReviewDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid review ID: ${id}`);
    }

    const updated = await this.reviewModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('user', 'username email')
      .populate('property', 'title');

    if (!updated) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return this.formatReviewResponse(updated);
  }

  // ----------------------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------------------
  async remove(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid review ID: ${id}`);
    }

    const deleted = await this.reviewModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return { message: 'Review deleted successfully' };
  }

  // ----------------------------------------------------------------------
  // RESPONSE FORMATTER (SAFE)
  // ----------------------------------------------------------------------
  private formatReviewResponse(review: any) {
    const user = review.user || {};
    const property = review.property || {};

    return {
      _id: review._id?.toString(),
      userId: user._id?.toString() || "",
      propertyId: property._id?.toString() || "",
      propertyName: review.propertyName || property.title || "",
      rating: review.rating,
      comment: review.comment,
      userName: review.userName || user.username || user.email || "",
      date: review.createdAt?.toISOString() || null,
      createdAt: review.createdAt?.toISOString() || null,
      updatedAt: review.updatedAt?.toISOString() || null,
      visiteId: review.visiteId?.toString() || null,
      logementId: review.logementId || null,
      collectorId: review.collectorId?.toString() || null,
    };
  }

}
