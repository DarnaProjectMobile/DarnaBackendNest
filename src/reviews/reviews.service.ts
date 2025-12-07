import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Annonce, AnnonceDocument } from '../annonces/entities/annonce.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Annonce.name) private readonly propertyModel: Model<AnnonceDocument>
  ) { }

  async create(arg1: string | CreateReviewDto, arg2: CreateReviewDto | string) {
    let userId: string;
    let dto: any; // Utiliser any pour permettre les champs supplémentaires comme visiteId

    // Détection de la signature : (userId, dto) ou (dto, userId)
    if (typeof arg1 === 'string') {
      userId = arg1;
      dto = arg2 as CreateReviewDto;
    } else {
      dto = arg1 as any;
      userId = arg2 as string;
    }

    // Validate ObjectId formats
    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user ID format: ${userId}`);
    }

    // property est maintenant optionnel dans le DTO si logementId est fourni
    // Validate property ID if provided
    if (dto.property && !isValidObjectId(dto.property)) {
      throw new BadRequestException(`Invalid property ID format: ${dto.property}`);
    }

    // Get user details
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    let property: any = null;
    let propertyName = '';

    // Trouver la propriété (Annonce)
    if (dto.property) {
      property = await this.propertyModel.findById(dto.property);
      if (!property) throw new NotFoundException('Property not found');
      propertyName = property.title;
    } else if (dto.logementId) {
      // Essayer de trouver par logementId (qui peut être propertyId ou annonceId)
      if (isValidObjectId(dto.logementId)) {
        property = await this.propertyModel.findById(dto.logementId);
      }
      // Si non trouvé par ID direct, on pourrait chercher par annonceId (custom field) si le modèle Annonce l'a (ici on suppose que non ou que findById suffit)

      if (property) {
        propertyName = property.title;
      }
    }

    const reviewData: any = {
      rating: dto.rating,
      comment: dto.comment,
      user: userId,
      userName: user.username || user.email,
      propertyName: propertyName || dto.propertyName || 'Propriété inconnue',
      visiteId: dto.visiteId,
      logementId: dto.logementId,
      collectorId: dto.collectorId,
    };

    // Gérer le champ 'property' qui est required dans le schéma
    if (property) {
      reviewData.property = property._id;
    } else if (dto.property && isValidObjectId(dto.property)) {
      reviewData.property = dto.property;
    } else if (dto.logementId && isValidObjectId(dto.logementId)) {
      // Fallback: on utilise logementId comme property ID
      reviewData.property = dto.logementId;
    } else {
      // Si on ne peut pas satisfaire la contrainte required property (ref Annonce)
      // Soit on throw une erreur, soit on génère un nouvel ID (dangereux), 
      // soit on espère que la validation Mongoose ne va pas exploser (elle va exploser).
      // On throw une erreur si on ne peut pas lier à une propriété
      throw new BadRequestException('Impossible de lier l\'évaluation à une annonce (property ID manquant ou invalide)');
    }

    const review = new this.reviewModel(reviewData);
    const savedReview = await review.save();

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

  async findByVisiteId(visiteId: string) {
    if (!isValidObjectId(visiteId)) {
      throw new BadRequestException(`Invalid visite ID format: ${visiteId}`);
    }
    const reviews = await this.reviewModel.find({ visiteId }).populate('user', 'username email');
    return reviews.map(review => this.formatReviewResponse(review));
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
      visiteId: review.visiteId ? review.visiteId.toString() : '',
      logementId: review.logementId || '',
      collectorId: review.collectorId ? review.collectorId.toString() : '',
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
