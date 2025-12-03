import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { User, UserDocument } from '../users/schemas/user.schema'; // Adjust path as needed
import { Annonce, AnnonceDocument } from '../annonces/entities/annonce.entity'; // Adjust path as needed

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Annonce.name) private readonly propertyModel: Model<AnnonceDocument>
  ) {}

  async create(userId: string, dto: CreateReviewDto) {
    // Validate ObjectId formats
    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user ID format: ${userId}`);
    }
    if (!isValidObjectId(dto.property)) {
      throw new BadRequestException(`Invalid property ID format: ${dto.property}`);
    }
    
    // Get user and property details
    const user = await this.userModel.findById(userId);
    const property = await this.propertyModel.findById(dto.property);
   
    if (!user) throw new NotFoundException('User not found');
    if (!property) throw new NotFoundException('Property not found');
   
    const review = new this.reviewModel({
      rating: dto.rating,
      comment: dto.comment,
      user: userId,
      property: dto.property,
      userName: user.username || user.email,
      propertyName: property.title
    });

    const savedReview = await review.save();
    
    // Format the response to match Swift model
    return this.formatReviewResponse(savedReview);
  }

  async findAll(propertyId?: string, userId?: string) {
    let query: any = {};
   
    // Validate ObjectId formats if provided
    if (propertyId && !isValidObjectId(propertyId)) {
      throw new BadRequestException(`Invalid property ID format: ${propertyId}`);
    }
    
    if (userId && !isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user ID format: ${userId}`);
    }
   
    if (propertyId) {
      query.property = propertyId;
    }
   
    if (userId) {
      query.user = userId;
    }
   
    const reviews = await this.reviewModel
      .find(query)
      .populate('user', 'username email')
      .populate('property', 'title');
      
    // Format all reviews to match Swift model
    return reviews.map(review => this.formatReviewResponse(review));
  }

  async findOne(id: string) {
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid review ID format: ${id}`);
    }
    
    const review = await this.reviewModel
      .findById(id)
      .populate('user', 'username email')
      .populate('property', 'title');

    if (!review) throw new NotFoundException(`Review with ID ${id} not found`);
    
    // Format the response to match Swift model
    return this.formatReviewResponse(review);
  }

  async update(id: string, dto: UpdateReviewDto) {
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid review ID format: ${id}`);
    }
    
    const updated = await this.reviewModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('user', 'username email')
      .populate('property', 'title');

    if (!updated) throw new NotFoundException(`Review with ID ${id} not found`);
    
    // Format the response to match Swift model
    return this.formatReviewResponse(updated);
  }

  async remove(id: string) {
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid review ID format: ${id}`);
    }
    
    const deleted = await this.reviewModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException(`Review with ID ${id} not found`);
    return { message: 'Review deleted successfully' };
  }
  
  // Méthode utilitaire pour formater les réponses
  private formatReviewResponse(review: any) {
    // Handle potential null/undefined values
    const user = review.user || {};
    const property = review.property || {};
    
    return {
      _id: review._id?.toString() || '',
      id: review._id?.toString() || '', // Ajout de l'id pour compatibilité avec Swift
      userId: user._id ? user._id.toString() : (typeof user === 'string' ? user : user.toString?.() || ''),
      propertyId: property._id ? property._id.toString() : (typeof property === 'string' ? property : property.toString?.() || ''),
      propertyName: review.propertyName || property.title || '',
      rating: review.rating || 0,
      comment: review.comment || '',
      date: review.createdAt ? new Date(review.createdAt).toISOString() : new Date().toISOString(), // Format ISO pour compatibilité avec Swift
      userName: review.userName || user.username || user.email || '',
      createdAt: review.createdAt || null,
      updatedAt: review.updatedAt || null
    };
  }
}
