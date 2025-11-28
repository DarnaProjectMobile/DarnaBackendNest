import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async create(createReviewDto: CreateReviewDto, userId: string): Promise<Review> {
    // Vérifier si une review existe déjà pour cette visite
    const existingReview = await this.reviewModel.findOne({
      visiteId: createReviewDto.visiteId,
      userId,
    });

    if (existingReview) {
      throw new BadRequestException('Vous avez déjà évalué cette visite');
    }

    // Calculer la note globale si elle n'est pas fournie
    let finalRating = createReviewDto.rating;
    if (
      finalRating == null &&
      createReviewDto.collectorRating != null &&
      createReviewDto.cleanlinessRating != null &&
      createReviewDto.locationRating != null &&
      createReviewDto.conformityRating != null
    ) {
      const sum =
        createReviewDto.collectorRating +
        createReviewDto.cleanlinessRating +
        createReviewDto.locationRating +
        createReviewDto.conformityRating;
      finalRating = Math.round(sum / 4);
    }

    if (finalRating == null) {
      throw new BadRequestException(
        'La note globale ou les sous-notes (collector, propreté, localisation, conformité) sont requises',
      );
    }

    const review = new this.reviewModel({
      ...createReviewDto,
      rating: finalRating,
      userId,
    });
    return review.save();
  }

  async findAll(): Promise<Review[]> {
    return this.reviewModel.find().exec();
  }

  async findByVisiteId(visiteId: string): Promise<Review[]> {
    return this.reviewModel.find({ visiteId }).exec();
  }

  async findByCollectorId(collectorId: string): Promise<Review[]> {
    return this.reviewModel.find({ collectorId }).exec();
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewModel.findById(id).exec();
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto): Promise<Review> {
    const updatedReview = await this.reviewModel
      .findByIdAndUpdate(id, updateReviewDto, { new: true })
      .exec();

    if (!updatedReview) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return updatedReview;
  }

  async remove(id: string): Promise<void> {
    const result = await this.reviewModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
  }

  async getCollectorReputation(collectorId: string): Promise<any> {
    const reviews = await this.reviewModel.find({ collectorId }).exec();
    const count = reviews.length;

    if (count === 0) {
      return {
        collectorId,
        reviewsCount: 0,
        averageRating: 0,
        averageCollectorRating: 0,
        averageCleanlinessRating: 0,
        averageLocationRating: 0,
        averageConformityRating: 0,
      };
    }

    const totals = reviews.reduce(
      (acc, review) => {
        acc.rating += review.rating;
        acc.collectorRating += review.collectorRating;
        acc.cleanlinessRating += review.cleanlinessRating;
        acc.locationRating += review.locationRating;
        acc.conformityRating += review.conformityRating;
        return acc;
      },
      {
        rating: 0,
        collectorRating: 0,
        cleanlinessRating: 0,
        locationRating: 0,
        conformityRating: 0,
      },
    );

    const toFixed1 = (value: number) => Math.round((value + Number.EPSILON) * 10) / 10;

    return {
      collectorId,
      reviewsCount: count,
      averageRating: toFixed1(totals.rating / count),
      averageCollectorRating: toFixed1(totals.collectorRating / count),
      averageCleanlinessRating: toFixed1(totals.cleanlinessRating / count),
      averageLocationRating: toFixed1(totals.locationRating / count),
      averageConformityRating: toFixed1(totals.conformityRating / count),
    };
  }
}
