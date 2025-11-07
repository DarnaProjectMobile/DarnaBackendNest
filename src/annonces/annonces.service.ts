import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateAnnonceDto } from './dto/create-annonce.dto';
import { UpdateAnnonceDto } from './dto/update-annonce.dto';
import { Annonce, AnnonceDocument } from './entities/annonce.entity';
import { User, UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class AnnoncesService {
  constructor(
    @InjectModel(Annonce.name) private readonly annonceModel: Model<AnnonceDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>, // <-- inject user model
  ) {}

  async create(createAnnonceDto: CreateAnnonceDto, userPayload: any): Promise<Annonce> {
    // Fetch the full user from DB
    const user = await this.userModel.findById(userPayload.userId);
    if (!user) throw new ForbiddenException('Authenticated user not found');

    if (user.role !== 'collocator') {
      throw new ForbiddenException('Only Collocators can create annonces');
    }

    const annonce = new this.annonceModel({
      ...createAnnonceDto,
      user: new Types.ObjectId(user._id), // ✅ must be ObjectId
    });

    return annonce.save();
  }

  async findAll(): Promise<Annonce[]> {
    return this.annonceModel.find().populate('user', 'username email').exec();
  }

  async findOne(id: string): Promise<Annonce> {
    const annonce = await this.annonceModel.findById(id).populate('user', 'username email').exec();
    if (!annonce) throw new NotFoundException(`Annonce #${id} not found`);
    return annonce;
  }

  async update(id: string, updateAnnonceDto: UpdateAnnonceDto, userPayload: any): Promise<Annonce> {
    const annonce = await this.annonceModel.findById(id);
    if (!annonce) throw new NotFoundException(`Annonce #${id} not found`);

    if (annonce.user.toString() !== userPayload.userId) {
      throw new ForbiddenException('You can only update your own annonces');
    }

    Object.assign(annonce, updateAnnonceDto);
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
}
