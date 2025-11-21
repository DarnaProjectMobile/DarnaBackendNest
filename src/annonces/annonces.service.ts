import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateAnnonceDto } from './dto/create-annonce.dto';
import { UpdateAnnonceDto } from './dto/update-annonce.dto';
import { Annonce, AnnonceDocument } from './entities/annonce.entity';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { BookAnnonceDto } from './dto/book-annonce.dto';

@Injectable()
export class AnnoncesService {
  constructor(
    @InjectModel(Annonce.name)
    private readonly annonceModel: Model<AnnonceDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createAnnonceDto: CreateAnnonceDto, userPayload: any): Promise<Annonce> {
    const user = await this.userModel.findById(userPayload.userId);
    if (!user) throw new ForbiddenException('Authenticated user not found');

    if (user.role !== 'collocator') {
      throw new ForbiddenException('Only Collocators can create annonces');
    }

    if (new Date(createAnnonceDto.startDate) >= new Date(createAnnonceDto.endDate)) {
      throw new BadRequestException('startDate must be earlier than endDate');
    }

    const annonce = new this.annonceModel({
      ...createAnnonceDto,
      user: new Types.ObjectId(user._id),
    });

    return annonce.save();
  }

  async findAll(): Promise<Annonce[]> {
    return this.annonceModel.find().populate('user', 'username email').exec();
  }

  async findOne(id: string): Promise<Annonce> {
    const annonce = await this.annonceModel
      .findById(id)
      .populate('user', 'username email')
      .populate('bookings.user', 'username email')
      .exec();

    if (!annonce) throw new NotFoundException(`Annonce #${id} not found`);
    return annonce;
  }

  async update(id: string, dto: UpdateAnnonceDto, userPayload: any): Promise<Annonce> {
    const annonce = await this.annonceModel.findById(id);
    if (!annonce) throw new NotFoundException(`Annonce #${id} not found`);

    if (annonce.user.toString() !== userPayload.userId) {
      throw new ForbiddenException('You can only update your own annonces');
    }

    if (dto.startDate && dto.endDate) {
      if (new Date(dto.startDate) >= new Date(dto.endDate)) {
        throw new BadRequestException('startDate must be earlier than endDate');
      }
    }

    Object.assign(annonce, dto);
    return annonce.save();
  }

  async remove(id: string, userPayload: any): Promise<{ message: string }> {
    const annonce = await this.annonceModel.findById(id);
    if (!annonce) throw new NotFoundException(`Annonce #${id} not found`);

    if (annonce.user.toString() !== userPayload.userId) {
      throw new ForbiddenException('You can only delete your own annonces');
    }

    await annonce.deleteOne();
    return { message: 'Annonce deleted successfully' };
  }

  // ⭐ NEW BOOKING METHOD
  async bookAnnonce(id: string, dto: BookAnnonceDto, userPayload: any) {
    const annonce = await this.annonceModel.findById(id);
    if (!annonce) throw new NotFoundException(`Annonce #${id} not found`);

    const bookingDate = new Date(dto.bookingStartDate);

    // check date validity
    if (
      bookingDate < new Date(annonce.startDate) ||
      bookingDate >= new Date(annonce.endDate)
    ) {
      throw new BadRequestException(
        'bookingStartDate must be >= annonce.startDate and < annonce.endDate',
      );
    }

    // check availability
    if (annonce.nbrCollocateurActuel >= annonce.nbrCollocateurMax) {
      throw new BadRequestException('Annonce is fully booked');
    }

    // save booking
    annonce.bookings.push({
      user: new Types.ObjectId(userPayload.userId),
      bookingStartDate: bookingDate,
    });

    // increment collocator count
    annonce.nbrCollocateurActuel += 1;

    return annonce.save();
  }
}
