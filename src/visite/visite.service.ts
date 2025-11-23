import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Visite, VisiteDocument } from './schemas/visite.schema';
import { CreateVisiteDto } from './dto/create-visite.dto';
import { UpdateVisiteDto } from './dto/update-visite.dto';
import { ReviewsService } from '../reviews/reviews.service';
import { CreateReviewDto } from '../reviews/dto/create-review.dto';
import { ReviewDocument } from '../reviews/entities/review.entity';
import { UsersService } from '../users/users.service';
import { LogementService } from '../logement/logement.service';
@Injectable()
export class VisiteService {
  constructor(
    @InjectModel(Visite.name) private visiteModel: Model<VisiteDocument>,
    private reviewsService: ReviewsService,
    private usersService: UsersService,
    private logementService: LogementService,
  ) {}

  async create(createVisiteDto: CreateVisiteDto, userId: string): Promise<Visite> {
    const visite = new this.visiteModel({
      ...createVisiteDto,
      userId,
      dateVisite: new Date(createVisiteDto.dateVisite),
      status: 'pending',
    });
    return visite.save();
  }

  async findAll(): Promise<any[]> {
    const visites = await this.visiteModel.find().exec();
    return this.enrichVisites(visites);
  }

  async findOneRaw(id: string): Promise<VisiteDocument> {
    const visite = await this.visiteModel.findById(id).exec();
    if (!visite) {
      throw new NotFoundException(`Visite with ID ${id} not found`);
    }
    return visite;
  }

  async findOne(id: string): Promise<any> {
    const visite = await this.findOneRaw(id);
    const enriched = await this.enrichVisites([visite]);
    return enriched[0];
  }

  async findByUserId(userId: string): Promise<any[]> {
    const visites = await this.visiteModel.find({ userId }).sort({ dateVisite: -1 }).exec();
    return this.enrichVisites(visites);
  }

  async findByLogementId(logementId: string): Promise<any[]> {
    const visites = await this.visiteModel
      .find({ logementId })
      .sort({ dateVisite: -1 })
      .exec();
    return this.enrichVisites(visites);
  }

  private async enrichVisites(visites: VisiteDocument[]): Promise<any[]> {
    return Promise.all(
      visites.map(async (visite) => {
        const visiteObj: any = visite.toObject();
        
        // Récupérer les informations du client
        try {
          const client = await this.usersService.findById(visite.userId);
          if (client) {
            // Extraire nom et prénom du username si possible (format: "Prénom Nom" ou "Prénom_Nom")
            const usernameParts = client.username.split(/[\s_]+/);
            visiteObj.clientUsername = client.username;
            visiteObj.clientName = usernameParts.length > 1 ? usernameParts.slice(1).join(' ') : client.username; // Nom (dernière partie)
            visiteObj.clientFirstName = usernameParts.length > 0 ? usernameParts[0] : client.username; // Prénom (première partie)
            visiteObj.clientFullName = client.username; // Nom complet
            visiteObj.clientEmail = client.email;
            visiteObj.clientPhone = client.numTel;
          }
        } catch (e) {
          // Ignorer les erreurs silencieusement
        }

        // Récupérer les informations du logement
        try {
          if (visite.logementId) {
            try {
              const logement = await this.logementService.findOne(visite.logementId);
              if (logement) {
                visiteObj.logementTitle = logement.title;
                visiteObj.logementAddress = logement.address;
              }
            } catch (e) {
              // Logement non trouvé, continuer
            }
          }
        } catch (e) {
          // Ignorer les erreurs silencieusement
        }

        return visiteObj;
      })
    );
  }

  async update(id: string, updateVisiteDto: UpdateVisiteDto): Promise<any> {
    const updateData: any = { ...updateVisiteDto };
    
    if (updateVisiteDto.dateVisite) {
      updateData.dateVisite = new Date(updateVisiteDto.dateVisite);
    }

    const updatedVisite = await this.visiteModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedVisite) {
      throw new NotFoundException(`Visite with ID ${id} not found`);
    }

    const enriched = await this.enrichVisites([updatedVisite]);
    return enriched[0];
  }

  async updateStatus(
    id: string,
    status: string,
  ): Promise<any> {
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    const updatedVisite = await this.visiteModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();

    if (!updatedVisite) {
      throw new NotFoundException(`Visite with ID ${id} not found`);
    }

    const enriched = await this.enrichVisites([updatedVisite]);
    return enriched[0];
  }

  async remove(id: string): Promise<void> {
    const result = await this.visiteModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Visite with ID ${id} not found`);
    }
  }

  async validateVisite(id: string, userId: string): Promise<any> {
    const visite = await this.findOneRaw(id);
    
    // Vérifier que c'est le client qui a fait la visite
    if (visite.userId !== userId) {
      throw new BadRequestException('Vous ne pouvez valider que vos propres visites');
    }

    // Vérifier que la visite est confirmée
    if (visite.status !== 'confirmed') {
      throw new BadRequestException('Vous ne pouvez valider que les visites confirmées');
    }

    const updatedVisite = await this.visiteModel
      .findByIdAndUpdate(id, { validated: true, status: 'completed' }, { new: true })
      .exec();

    if (!updatedVisite) {
      throw new NotFoundException(`Visite with ID ${id} not found`);
    }

    const enriched = await this.enrichVisites([updatedVisite]);
    return enriched[0];
  }

  async addDocuments(id: string, documents: string[], userId: string): Promise<any> {
    const visite = await this.visiteModel.findById(id).exec();
    if (!visite) {
      throw new NotFoundException(`Visite with ID ${id} not found`);
    }
    
    // Vérifier que c'est le client qui a fait la visite
    if (visite.userId !== userId) {
      throw new BadRequestException('Vous ne pouvez ajouter des documents que pour vos propres visites');
    }

    // Permettre l'upload si la visite est confirmée ou validée
    if (visite.status !== 'confirmed' && visite.status !== 'completed' && !visite.validated) {
      throw new BadRequestException('Vous ne pouvez ajouter des documents que pour les visites confirmées ou validées');
    }

    const existingDocuments = visite.documents || [];
    const updatedDocuments = [...existingDocuments, ...documents];

    const updatedVisite = await this.visiteModel
      .findByIdAndUpdate(id, { documents: updatedDocuments }, { new: true })
      .exec();

    if (!updatedVisite) {
      throw new NotFoundException(`Visite with ID ${id} not found`);
    }

    const enriched = await this.enrichVisites([updatedVisite]);
    return enriched[0];
  }

  async createReview(id: string, createReviewDto: CreateReviewDto, userId: string): Promise<any> {
    const visite = await this.findOneRaw(id);
    
    // Vérifier que c'est le client qui a fait la visite
    if (visite.userId !== userId) {
      throw new BadRequestException('Vous ne pouvez évaluer que vos propres visites');
    }

    // Vérifier que la visite est validée
    if (!visite.validated) {
      throw new BadRequestException('Vous devez d\'abord valider la visite avant de l\'évaluer');
    }

    // Créer la review
    const review = await this.reviewsService.create(
      { ...createReviewDto, visiteId: id },
      userId,
    );

    // Mettre à jour la visite avec l'ID de la review
    const reviewId = (review as ReviewDocument).id;
    const updatedVisite = await this.visiteModel
      .findByIdAndUpdate(
        id,
        {
          reviewId,
        },
        { new: true }
      )
      .exec();

    return { visite: updatedVisite, review };
  }


  async getVisiteReviews(id: string): Promise<any[]> {
    await this.findOne(id); // Vérifier que la visite existe
    return this.reviewsService.findByVisiteId(id);
  }
}
