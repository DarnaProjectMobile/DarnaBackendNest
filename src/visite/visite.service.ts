import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Visite, VisiteDocument } from './schemas/visite.schema';
import { CreateVisiteDto } from './dto/create-visite.dto';
import { UpdateVisiteDto } from './dto/update-visite.dto';
import { ReviewsService } from '../reviews/reviews.service';
import { CreateReviewDto } from '../reviews/dto/create-review.dto';
import { ReviewDocument } from '../reviews/entities/review.entity';
import { UsersService } from '../users/users.service';
import { LogementService } from '../logement/logement.service';
import { NotificationsFirebaseService } from '../notifications-firebase/notifications-firebase.service';
@Injectable()
export class VisiteService {
  constructor(
    @InjectModel(Visite.name) private visiteModel: Model<VisiteDocument>,
    private reviewsService: ReviewsService,
    private usersService: UsersService,
    private logementService: LogementService,
    private notificationsFirebaseService: NotificationsFirebaseService,
  ) {}

  async create(createVisiteDto: CreateVisiteDto, userId: string): Promise<Visite> {
    // Parse and validate the date
    const dateVisite = new Date(createVisiteDto.dateVisite);
    if (isNaN(dateVisite.getTime())) {
      throw new BadRequestException('Date de visite invalide');
    }

    const visite = new this.visiteModel({
      ...createVisiteDto,
      userId,
      dateVisite: dateVisite,
      status: 'pending',
    });
    
    // Save the visite to MongoDB
    const savedVisite = await visite.save();
    
    // Verify the visite was saved correctly
    if (!savedVisite || !savedVisite._id) {
      throw new BadRequestException('Erreur lors de l\'enregistrement de la visite dans MongoDB');
    }
    
    return savedVisite;
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

  private async getLogementByIdOrAnnonceId(logementId: string) {
    try {
      // Vérifier si c'est un ObjectId valide
      if (Types.ObjectId.isValid(logementId) && new Types.ObjectId(logementId).toString() === logementId) {
        return await this.logementService.findOne(logementId);
      } else {
        // Sinon, c'est probablement un annonceId
        return await this.logementService.findByAnnonceId(logementId);
      }
    } catch (error) {
      // Si le logement n'existe pas, créer un logement temporaire avec les infos disponibles
      // Cela permet de continuer même si le logement n'a pas été créé dans MongoDB
      const mockLogements: Record<string, any> = {
        'appartement-3-pieces-centre-ville': {
          annonceId: 'appartement-3-pieces-centre-ville',
          title: 'Appartement 3 pièces - Centre Ville',
          ownerId: 'default-owner-id',
          address: 'Centre Ville, Tunis',
          price: 450,
          rooms: 3,
          surface: 75
        },
        'studio-meuble-lyon': {
          annonceId: 'studio-meuble-lyon',
          title: 'Studio meublé - Lyon',
          ownerId: 'default-owner-id',
          address: 'Lyon, France',
          price: 380,
          rooms: 1,
          surface: 25
        },
        'studio-meuble-lyon-1': {
          annonceId: 'studio-meuble-lyon-1',
          title: 'Studio meublé - Lyon',
          ownerId: 'default-owner-id',
          address: 'Lyon, France',
          price: 380,
          rooms: 1,
          surface: 25
        },
        'studio-meuble-lyon-2': {
          annonceId: 'studio-meuble-lyon-2',
          title: 'Studio meublé - Lyon',
          ownerId: 'default-owner-id',
          address: 'Lyon, France',
          price: 400,
          rooms: 1,
          surface: 28
        },
        'chambre-t4-marseille-8e': {
          annonceId: 'chambre-t4-marseille-8e',
          title: 'Chambre dans T4 - Marseille 8e',
          ownerId: 'default-owner-id',
          address: 'Marseille 8e, France',
          price: 320,
          rooms: 1,
          surface: 15
        }
      };

      // Chercher dans les logements mock
      const mockLogement = mockLogements[logementId];
      if (mockLogement) {
        // Essayer de créer le logement dans MongoDB s'il n'existe pas
        try {
          await this.logementService.create({
            annonceId: mockLogement.annonceId,
            title: mockLogement.title,
            description: `Logement créé automatiquement pour ${mockLogement.title}`,
            address: mockLogement.address || (mockLogement.title.includes('Lyon') ? 'Lyon, France' : 
                     mockLogement.title.includes('Marseille') ? 'Marseille, France' : 
                     'Centre Ville, Tunis'),
            price: mockLogement.price || 400,
            rooms: mockLogement.rooms || (mockLogement.title.includes('Studio') ? 1 : 
                   mockLogement.title.includes('3 pièces') ? 3 : 2),
            surface: mockLogement.surface || 50,
            available: true
          }, mockLogement.ownerId);
          // Récupérer le logement créé
          try {
            return await this.logementService.findByAnnonceId(mockLogement.annonceId);
          } catch {
            return mockLogement;
          }
        } catch (createError: any) {
          // Si la création échoue (déjà existe ou autre erreur), essayer de récupérer
          if (createError.message?.includes('existe déjà')) {
            try {
              return await this.logementService.findByAnnonceId(mockLogement.annonceId);
            } catch {
              return mockLogement;
            }
          }
          return mockLogement;
        }
      }
      
      // Si aucun logement mock trouvé, créer un logement temporaire avec le logementId comme titre
      return {
        annonceId: logementId,
        title: logementId,
        ownerId: 'default-owner-id'
      };
    }
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
              const logement = await this.getLogementByIdOrAnnonceId(visite.logementId);
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
    cancelledByClient: boolean = false,
  ): Promise<any> {
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'refused'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }
    
    // Si le statut est "cancelled" mais que cancelledByClient est false, c'est un refus par le collecteur
    // On change le statut en "refused" pour distinguer
    let finalStatus = status;
    if (status === 'cancelled' && !cancelledByClient) {
      finalStatus = 'refused';
    }

    // Récupérer la visite avant mise à jour pour vérifier l'ancien statut
    const oldVisite = await this.visiteModel.findById(id).exec();
    const wasConfirmed = oldVisite?.status === 'confirmed';

    const updatedVisite = await this.visiteModel
      .findByIdAndUpdate(id, { status: finalStatus }, { new: true })
      .exec();

    if (!updatedVisite) {
      throw new NotFoundException(`Visite with ID ${id} not found`);
    }

    const enriched = await this.enrichVisites([updatedVisite]);
    const visiteData = enriched[0];

    // Créer des notifications selon le statut (Firebase uniquement)
    try {
      if (finalStatus === 'confirmed') {
        // Notifications Firebase pour le client + planification des rappels
        const visiteId =
          (visiteData as any).id ||
          (visiteData as any)._id?.toString?.() ||
          id;
        await this.notificationsFirebaseService.notifyVisitAccepted({
          userId: visiteData.userId,
          visitId: visiteId,
          housingId: visiteData.logementId,
          housingTitle: visiteData.logementTitle,
        });
        if (visiteData.dateVisite) {
          // Récupérer le propriétaire du logement pour les rappels collector
          let collectorId: string | undefined;
          try {
            if (visiteData.logementId) {
              const logement = await this.getLogementByIdOrAnnonceId(visiteData.logementId);
              collectorId = logement?.ownerId;
            }
          } catch (error) {
            console.warn('Impossible de récupérer le propriétaire pour les rappels:', error);
          }

          await this.notificationsFirebaseService.scheduleVisitReminders({
            userId: visiteData.userId,
            visitId: visiteId,
            housingId: visiteData.logementId,
            housingTitle: visiteData.logementTitle,
            visitDate: new Date(visiteData.dateVisite),
            collectorId: collectorId,
            clientName: visiteData.clientUsername || visiteData.clientName || 'un client',
          });
        }
      } else if (finalStatus === 'refused') {
        // Si c'est le collecteur qui refuse, notifier le client
        const visiteId =
          (visiteData as any).id ||
          (visiteData as any)._id?.toString?.() ||
          id;
        await this.notificationsFirebaseService.notifyVisitRefused({
          userId: visiteData.userId,
          visitId: visiteId,
          housingId: visiteData.logementId,
          housingTitle: visiteData.logementTitle,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      // Ne pas faire échouer la mise à jour si la notification échoue
    }

    return visiteData;
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

    // Récupérer le logement pour déterminer le collector/propriétaire
    if (!visite.logementId) {
      throw new BadRequestException('La visite n\'est pas associée à un logement valide');
    }

    let logement;
    let collectorId = 'default-owner-id'; // ID par défaut si le logement n'existe pas
    
    try {
      logement = await this.getLogementByIdOrAnnonceId(visite.logementId);
      collectorId = logement?.ownerId || collectorId;
    } catch (error) {
      // Si le logement n'existe pas, utiliser un ID par défaut
      // Cela permet de créer l'évaluation même si le logement n'est pas encore dans MongoDB
      console.warn(`Logement ${visite.logementId} non trouvé, utilisation de l'ID par défaut pour l'évaluation`);
    }

    // Créer la review même si le logement n'existe pas encore
    const review = await this.reviewsService.create(
      {
        ...createReviewDto,
        visiteId: id,
        logementId: visite.logementId,
        collectorId: collectorId,
      },
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
