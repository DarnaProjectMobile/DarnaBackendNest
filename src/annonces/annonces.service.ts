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
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { BookAnnonceDto } from './dto/book-annonce.dto';
import { NotificationService } from 'src/notification/notification.service';
import { Annonce, AnnonceDocument } from './entities/annonce.entity';

@Injectable()
export class AnnoncesService {
  constructor(
    @InjectModel(Annonce.name)
    private readonly annonceModel: Model<AnnonceDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly notificationService: NotificationService,
  ) {}

  // ============================
  // CREATE ANNONCE
  // ============================
  async create(
    createAnnonceDto: CreateAnnonceDto,
    userPayload: any,
    imagePaths: string[],
  ): Promise<Annonce> {
    const user = await this.userModel.findById(userPayload.userId);
    if (!user) throw new ForbiddenException('Authenticated user not found');

    if (user.role !== 'collocator') {
      throw new ForbiddenException('Only Collocators can create annonces');
    }

    const start = new Date(createAnnonceDto.startDate);
    const end = new Date(createAnnonceDto.endDate);

    if (start >= end) {
      throw new BadRequestException('startDate must be earlier than endDate');
    }

    const annonce = new this.annonceModel({
      ...createAnnonceDto,
      startDate: start,
      endDate: end,
      images: imagePaths,
      user: user._id,
    });

    return annonce.save();
  }

  // ============================
  // GET ALL
  // ============================
  async findAll(): Promise<Annonce[]> {
    return this.annonceModel.find().populate('user', 'username email').exec();
  }

  // ============================
  // GET ONE
  // ============================
  async findOne(id: string): Promise<Annonce> {
    const annonce = await this.annonceModel
      .findById(id)
      .populate('user', 'username email')
      .populate('bookings.user', 'username email')
      .populate('attendingListBookings.user', 'username email')
      .exec();

    if (!annonce) throw new NotFoundException(`Annonce #${id} not found`);
    return annonce;
  }

  // ============================
  // UPDATE ANNONCE
  // ============================
  async update(
    id: string,
    dto: UpdateAnnonceDto,
    userPayload: any,
    newImages?: string[],
  ): Promise<Annonce> {
    const annonce = await this.annonceModel.findById(id);
    if (!annonce) throw new NotFoundException(`Annonce #${id} not found`);

    if (annonce.user.toString() !== userPayload.userId) {
      throw new ForbiddenException('You can only update your own annonces');
    }

    // Validate new dates if provided
    if (dto.startDate) {
      annonce.startDate = new Date(dto.startDate);
    }

    if (dto.endDate) {
      annonce.endDate = new Date(dto.endDate);
    }

    if (dto.startDate && dto.endDate) {
      if (new Date(dto.startDate) >= new Date(dto.endDate)) {
        throw new BadRequestException('startDate must be earlier than endDate');
      }
    }

    // Apply other updated fields  
    Object.assign(annonce, dto);

    // Handle images
    if (newImages?.length) {
      annonce.images = newImages;
    }

    return annonce.save();
  }

  // ============================
  // DELETE ANNONCE
  // ============================
  async remove(id: string, userPayload: any): Promise<{ message: string }> {
    const annonce = await this.annonceModel.findById(id);
    if (!annonce) throw new NotFoundException(`Annonce #${id} not found`);

    if (annonce.user.toString() !== userPayload.userId) {
      throw new ForbiddenException('You can only delete your own annonces');
    }

    await annonce.deleteOne();
    return { message: 'Annonce deleted successfully' };
  }

  // ============================
  // BOOKING REQUEST
  // ============================
  async bookAnnonce(id: string, dto: BookAnnonceDto, userPayload: any) {
    const annonce = await this.annonceModel.findById(id);
    if (!annonce) throw new NotFoundException(`Annonce #${id} not found`);

    const bookingDate = new Date(dto.bookingStartDate);

    if (bookingDate < annonce.startDate || bookingDate >= annonce.endDate) {
      throw new BadRequestException(
        'bookingStartDate must be >= annonce.startDate and < annonce.endDate',
      );
    }

    annonce.attendingListBookings.push({
      _id: new Types.ObjectId(),
      user: new Types.ObjectId(userPayload.userId),
      bookingStartDate: bookingDate,
    });

    const savedAnnonce = await annonce.save();

    const [owner, bookingUser] = await Promise.all([
      this.userModel.findById(annonce.user),
      this.userModel.findById(userPayload.userId),
    ]);

    if (owner?.deviceTokens?.length) {
      await this.notificationService.notifyBookingRequest(owner.deviceTokens, {
        annonceId: savedAnnonce._id.toString(),
        annonceTitle: savedAnnonce.title,
        bookingDate: this.formatBookingDate(bookingDate),
        bookingUserName: bookingUser?.username,
        type: 'BOOKING_REQUEST',
      });
    }

    return savedAnnonce;
  }

  // ============================
  // ACCEPT / REJECT BOOKING
  // ============================
  async acceptBooking(
    annonceId: string,
    bookingId: string,
    accept: boolean,
  ): Promise<Annonce> {
    const annonce = await this.annonceModel.findById(annonceId);
    if (!annonce) throw new NotFoundException(`Annonce #${annonceId} not found`);

    const bookingIndex = annonce.attendingListBookings.findIndex(
      b => b._id.toString() === bookingId,
    );

    if (bookingIndex === -1) throw new NotFoundException('Booking not found');

    const booking = annonce.attendingListBookings[bookingIndex];

    if (accept) {
      annonce.bookings.push(booking);
      annonce.nbrCollocateurActuel++;

      if (annonce.nbrCollocateurActuel > annonce.nbrCollocateurMax) {
        throw new BadRequestException('Annonce is fully booked');
      }
    }

    // Remove from pending list (both accept and reject)
    annonce.attendingListBookings.splice(bookingIndex, 1);

    const savedAnnonce = await annonce.save();

    const bookingUser = await this.userModel.findById(booking.user);

    if (bookingUser?.deviceTokens?.length) {
      await this.notificationService.notifyBookingResponse(
        bookingUser.deviceTokens,
        {
          annonceId: savedAnnonce._id.toString(),
          annonceTitle: savedAnnonce.title,
          bookingDate: this.formatBookingDate(booking.bookingStartDate),
          bookingUserName: bookingUser.username,
          type: 'BOOKING_RESPONSE',
          accepted: accept ? 'true' : 'false',
        },
      );
    }

    return savedAnnonce;
  }

  private formatBookingDate(date: Date) {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
