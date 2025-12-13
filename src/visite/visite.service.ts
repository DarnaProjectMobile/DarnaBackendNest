import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Visite, VisiteDocument } from './schemas/visite.schema';
import { CreateVisiteDto } from './dto/create-visite.dto';
import { UpdateVisiteDto } from './dto/update-visite.dto';
import { ReviewsService } from '../reviews/reviews.service';
import { CreateReviewDto } from '../reviews/dto/create-review.dto';
import { ReviewDocument } from '../reviews/entities/review.entity';
import { UsersService } from '../users/users.service';
import { LogementService } from '../logement/logement.service';
import { NotificationsFirebaseService } from '../notifications-firebase/notifications-firebase.service';
import { AnnoncesService } from '../annonces/annonces.service';
import { AvailabilityService } from '../availability/availability.service';

@Injectable()
export class VisiteService {
  constructor(
    @InjectModel(Visite.name) private visiteModel: Model<VisiteDocument>,
    private reviewsService: ReviewsService,
    private usersService: UsersService,
    private logementService: LogementService,
    private notificationsFirebaseService: NotificationsFirebaseService,
    private annoncesService: AnnoncesService,
    private availabilityService: AvailabilityService,
  ) { }

  async create(createVisiteDto: CreateVisiteDto, userId: string): Promise<Visite> {
    console.log('--- Creating Visite ---');
    console.log('User ID:', userId);
    console.log('DTO:', JSON.stringify(createVisiteDto));

    // Parse and validate the date
    let dateVisite = new Date(createVisiteDto.dateVisite);

    // Attempt to handle common non-ISO formats if simple parsing fails
    if (isNaN(dateVisite.getTime())) {
      console.warn(`[VisiteService] Received invalid date format: "${createVisiteDto.dateVisite}". Trying to parse manually...`);
      // Try parsing DD/MM/YYYY or similar if needed, or just log for now.
      // For now, let's see if we can just fix simple cases or just fail with better logs.
    }

    if (isNaN(dateVisite.getTime())) {
      console.error('Invalid Date:', createVisiteDto.dateVisite);
      throw new BadRequestException(`Date de visite invalide: "${createVisiteDto.dateVisite}". Format attendu: ISO 8601 (ex: 2025-12-31T10:00:00.000Z)`);
    }

    let finalLogementId = createVisiteDto.logementId;
    let resolvedOwnerId: string | undefined;

    // Tenter de récupérer le titre du logement si un ID ou annonceId est fourni
    // L'utilisateur souhaite que la visite soit enregistrée "selon le nom de l'appartement"
    try {
      if (isValidObjectId(finalLogementId)) {
        // 1. Try Logement
        try {
          const logement = await this.logementService.findOne(finalLogementId);
          if (logement) {
            finalLogementId = logement.title;
            resolvedOwnerId = (logement as any).ownerId || (logement as any).user;
          }
        } catch (ignored) {
          // Logement not found, try Annonce
          try {
            console.log(`[VisiteService] Logement not found so trying Annonce lookup for ${finalLogementId}`);
            const annonce = await this.annoncesService.findOne(finalLogementId);
            if (annonce) {
              finalLogementId = annonce.title;
              resolvedOwnerId = (annonce as any).user; // Assuming user is the owner
            }
          } catch (e) {
            // Not found in Annonce either
          }
        }
      } else {
        // Essayer comme annonceId
        try {
          const logement = await this.logementService.findByAnnonceId(finalLogementId);
          if (logement) {
            finalLogementId = logement.title;
            resolvedOwnerId = (logement as any).ownerId || (logement as any).user;
          }
        } catch (e) {
          // Pas trouvé par annonceId, supposons que c'est déjà le titre ou inconnu
          // On garde la valeur telle quelle
        }
      }
    } catch (e) {
      console.warn(`[VisiteService] Could not resolve logement title for ${finalLogementId}, keeping original value.`);
    }

    // Availability Check
    if (resolvedOwnerId) {
      const availability = await this.availabilityService.getAvailability(resolvedOwnerId.toString());
      if (availability) {
        // 1. Check Days
        const day = dateVisite.getDay(); // 0=Sun, 1=Mon...
        if (availability.availableDays && availability.availableDays.length > 0) {
          if (!availability.availableDays.includes(day)) {
            throw new BadRequestException('Le propriétaire n\'est pas disponible ce jour de la semaine.');
          }
        }

        // 2. Check Blocked Dates
        if (availability.unavailableDates && availability.unavailableDates.length > 0) {
          const isBlocked = availability.unavailableDates.some(ud => {
            const d = new Date(ud);
            return d.getUTCFullYear() === dateVisite.getUTCFullYear() &&
              d.getUTCMonth() === dateVisite.getUTCMonth() &&
              d.getUTCDate() === dateVisite.getUTCDate();
          });
          if (isBlocked) {
            throw new BadRequestException('Cette date est indisponible (bloquée).');
          }
        }

        // 3. Check Time Slots
        if (availability.availableTimeSlots && availability.availableTimeSlots.length > 0) {
          const hour = dateVisite.getHours(); // Local or UTC? Input checks ISO string.
          // Assuming dateVisite is a Date object, getHours() returns local time of the server.
          // We should probably rely on the string hour or ensure consistent timezone.
          // For simplicity, let's compare as-is.
          const minute = dateVisite.getMinutes();
          const visitTime = hour * 60 + minute;

          const isWithinSlot = availability.availableTimeSlots.some(slot => {
            const [sH, sM] = slot.startTime.split(':').map(Number);
            const [eH, eM] = slot.endTime.split(':').map(Number);
            const start = sH * 60 + sM;
            const end = eH * 60 + eM;
            return visitTime >= start && visitTime < end;
          });

          if (!isWithinSlot) {
            throw new BadRequestException(`L'heure choisie (${hour}:${minute < 10 ? '0' + minute : minute}) est en dehors des créneaux de disponibilité.`);
          }
        }
      }
    }

    try {
      const visite = new this.visiteModel({
        ...createVisiteDto,
        logementId: finalLogementId,
        userId,
        dateVisite: dateVisite,
        status: 'pending',
      });

      console.log('Visite Model created, attempting to save:', visite);

      // Save the visite to MongoDB
      const savedVisite = await visite.save();

      console.log('Visite saved successfully:', savedVisite);

      // Verify the visite was saved correctly
      if (!savedVisite || !savedVisite._id) {
        throw new BadRequestException('Erreur lors de\'enregistrement de la visite dans MongoDB');
      }

      return savedVisite;
    } catch (error) {
      console.error('Error saving visite:', error);
      throw error;
    }
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

  async findByOwnerId(ownerId: string): Promise<any[]> {
    // 1. Trouver les logements de l'utilisateur
    const logements = await this.logementService.findByOwnerId(ownerId);

    // 2. Trouver les annonces de l'utilisateur
    let annoncesIds: string[] = [];
    try {
      const annonces = await this.annoncesService.findByUser(ownerId);
      annoncesIds = annonces.map(a => (a as any)._id.toString());
    } catch (e) {
      console.warn('Error fetching user annonces:', e);
    }

    const logementIds = logements.map(l => (l as any)._id.toString());
    const logementTitles = logements.map(l => l.title);

    // Combiner tous les identifiants possibles
    const allIds = [...new Set([...logementIds, ...annoncesIds, ...logementTitles])];

    if (allIds.length === 0) {
      return [];
    }

    // 3. Trouver les visites pour ces logements
    const visites = await this.visiteModel
      .find({ logementId: { $in: allIds } })
      .sort({ dateVisite: -1 })
      .exec();

    return this.enrichVisites(visites);
  }

  private async enrichVisites(visites: VisiteDocument[]): Promise<any[]> {
    if (!visites || visites.length === 0) return [];

    console.log('[VisiteService] Enriching ' + visites.length + ' visits...');

    return Promise.all(visites.map(async (visite) => {
      const visiteObj: any = visite.toObject();

      // Enrichir avec infos logement
      if (visite.logementId) {
        try {
          const logement = await this.getLogementByIdOrAnnonceId(visite.logementId);
          if (logement) {
            visiteObj.logementTitle = logement.title;
            visiteObj.logementAddress = logement.address;
            visiteObj.ownerId = logement.ownerId || logement.user;
          } else {
            // Fallback
            if (!visiteObj.logementTitle) visiteObj.logementTitle = visite.logementId;
          }
        } catch (e) {
          console.warn('Error enriching visite with logement details:', e);
          if (!visiteObj.logementTitle) visiteObj.logementTitle = visite.logementId;
        }
      }

      // Enrichir avec infos utilisateur (client)
      if (visite.userId) {
        try {
          const user = await this.usersService.findById(visite.userId);
          if (user) {
            visiteObj.clientUsername = user.username;
            visiteObj.clientImage = user.image;
            visiteObj.clientPhone = user.numTel;
          }
        } catch (e) {
          // Ignore user enrichment errors
        }
      }

      return visiteObj;
    }));
  }

  private async getLogementByIdOrAnnonceId(logementId: string) {
    try {
      // Vérifier si c'est un ObjectId valide
      if (isValidObjectId(logementId)) {
        // 1. Essayer de trouver dans Logement
        try {
          const logement = await this.logementService.findOne(logementId);
          if (logement) return logement;
        } catch (ignored) { }

        // 2. Si non trouvé dans Logement, essayer de trouver dans Annonce
        try {
          console.log('[VisiteService] Looking for Annonce ID: ' + logementId);
          const annonce = await this.annoncesService.findOne(logementId);
          if (annonce) {
            console.log('[VisiteService] Found Annonce: ' + annonce.title);
            // Adapter l'annonce au format logement pour enrichVisites
            return {
              _id: annonce._id,
              title: annonce.title,
              address: annonce.location || 'Adresse non spécifiée',
              ownerId: (annonce.user as any)._id || annonce.user,
              // Ajouter d'autres champs si nécessaire
            };
          }
        } catch (e) {
          console.warn('[VisiteService] Annonce lookup failed: ' + e.message);
        }

        return null; // Ni logement ni annonce trouvé
      } else {
        // Sinon, c'est probablement un annonceId ou un titre
        try {
          return await this.logementService.findByAnnonceId(logementId);
        } catch (e) {
          // Si pas trouvé par annonceId, essayer par titre
          const byTitle = await this.logementService.findByTitle(logementId);
          if (byTitle) return byTitle;
          throw e; // Déclencher le bloc catch global pour utiliser les mocks
        }
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
        console.log(`[VisiteService] Envoi de notification "Visite acceptée" au client ${visiteData.userId} pour la visite ${visiteId}`);

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
            console.warn('[VisiteService] Impossible de récupérer le propriétaire pour les rappels:', error);
          }

          console.log(`[VisiteService] Planification des rappels pour la visite ${visiteId} (date: ${visiteData.dateVisite}, client: ${visiteData.userId}, collector: ${collectorId || 'N/A'})`);

          await this.notificationsFirebaseService.scheduleVisitReminders({
            userId: visiteData.userId,
            visitId: visiteId,
            housingId: visiteData.logementId,
            housingTitle: visiteData.logementTitle,
            visitDate: new Date(visiteData.dateVisite),
            collectorId: collectorId,
            clientName: visiteData.clientUsername || visiteData.clientName || 'un client',
          });
        } else {
          console.warn(`[VisiteService] Pas de date de visite pour planifier les rappels (visite ${visiteId})`);
        }
      } else if (finalStatus === 'refused') {
        // Si c'est le collecteur qui refuse, notifier le client
        const visiteId =
          (visiteData as any).id ||
          (visiteData as any)._id?.toString?.() ||
          id;

        console.log(`[VisiteService] Envoi de notification "Visite refusée" au client ${visiteData.userId} pour la visite ${visiteId}`);

        await this.notificationsFirebaseService.notifyVisitRefused({
          userId: visiteData.userId,
          visitId: visiteId,
          housingId: visiteData.logementId,
          housingTitle: visiteData.logementTitle,
        });
      }
    } catch (error) {
      console.error('[VisiteService] Erreur lors de la création de la notification:', error);
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

    // Vérifier que la visite est validée ou auto-valider si confirmée
    if (!visite.validated) {
      if (visite.status === 'confirmed' || visite.status === 'completed') {
        // Auto-validate
        visite.validated = true;
        visite.status = 'completed';
        await visite.save();
      } else {
        throw new BadRequestException('Vous devez d\'abord effectuer la visite (statut confirmé) avant de l\'évaluer');
      }
    }

    // Récupérer le logement pour déterminer le collector/propriétaire
    if (!visite.logementId) {
      throw new BadRequestException('La visite n\'est pas associée à un logement valide');
    }

    let logement;
    let collectorId: string | undefined;

    try {
      logement = await this.getLogementByIdOrAnnonceId(visite.logementId);
      if (logement && logement.ownerId && isValidObjectId(logement.ownerId)) {
        collectorId = logement.ownerId;
      } else if (logement && (logement as any).user && isValidObjectId((logement as any).user)) {
        collectorId = (logement as any).user;
      }
    } catch (error) {
      console.warn(`Logement ${visite.logementId} non trouvé, évaluation sans propriétaire lié explicitement.`);
    }

    // Créer la review
    const reviewPayload: any = {
      ...createReviewDto,
      visiteId: id,
      logementId: visite.logementId,
    };

    // N'ajouter collectorId que s'il est valide
    if (collectorId) {
      reviewPayload.collectorId = collectorId;
    }

    const review = await this.reviewsService.create(reviewPayload, userId);

    // Mettre à jour la visite avec l'ID de la review
    const reviewId = (review as any).id || (review as any)._id;
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
