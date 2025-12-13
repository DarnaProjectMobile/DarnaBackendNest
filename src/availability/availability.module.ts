import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Availability, AvailabilitySchema } from './schemas/availability.schema';
import { AvailabilityService } from './availability.service';
import { AnnoncesModule } from '../annonces/annonces.module';
import { LogementModule } from '../logement/logement.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Availability.name, schema: AvailabilitySchema }]),
        forwardRef(() => AnnoncesModule),
        LogementModule
    ],
    providers: [AvailabilityService],
    exports: [AvailabilityService]
})
export class AvailabilityModule { }
