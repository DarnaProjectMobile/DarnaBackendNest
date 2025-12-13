
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Availability, AvailabilityDocument } from './schemas/availability.schema';
import { UpdateAvailabilityDto } from './dto/availability.dto';
import { AnnoncesService } from '../annonces/annonces.service';
import { LogementService } from '../logement/logement.service';

@Injectable()
export class AvailabilityService {
    constructor(
        @InjectModel(Availability.name) private availabilityModel: Model<AvailabilityDocument>,
        private readonly annoncesService: AnnoncesService,
        private readonly logementService: LogementService,
    ) { }

    async getAvailability(userId: string): Promise<any> {
        const availability = await this.availabilityModel.findOne({ userId }).exec();
        const announcements = await this.annoncesService.findByUser(userId);
        const logements = await this.logementService.findByOwnerId(userId);

        // Enrich response with announcements (titles and types)
        // If availability is null, we can still return the announcements
        // so the frontend knows what properties are managed by this user.

        const response: any = availability ? availability.toObject() : { userId, availableDays: [], unavailableDates: [], availableTimeSlots: [] };

        response.annonces = announcements.map(a => ({
            _id: a._id,
            title: a.title,
            type: a.type,
            location: a.location,
            images: a.images
        }));

        response.logements = logements.map(l => ({
            _id: (l as any)._id,
            title: l.title,
            address: l.address,
            price: l.price,
            images: l.images
        }));

        return response;
    }

    async updateAvailability(userId: string, updateDto: UpdateAvailabilityDto): Promise<Availability> {
        return this.availabilityModel.findOneAndUpdate(
            { userId },
            { $set: { userId, ...updateDto } }, // Ensure userId is set on create
            { new: true, upsert: true }
        ).exec();
    }
}
