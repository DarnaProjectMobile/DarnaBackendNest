import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QrCodeService } from 'src/qrcode/qrcode.service';
import { Publicite, PubliciteDocument } from './entities/publicite.entity';
import { CreatePubliciteDto } from './dto/create-publicite.dto';
import { UpdatePubliciteDto } from './dto/update-publicite.dto';
import { User, UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class PubliciteService {
  constructor(
    @InjectModel(Publicite.name)
    private readonly model: Model<PubliciteDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly qrCodeService: QrCodeService,
  ) {}

  // Création d'une publicité
  async create(dto: CreatePubliciteDto, userPayload: any) {
    const sponsor = await this.userModel.findById(userPayload.userId);
    if (!sponsor) throw new ForbiddenException('Authenticated user not found');

    if (sponsor.role !== 'sponsor') {
      throw new ForbiddenException('Only Sponsors can create publicités');
    }

    const pub = new this.model({
      ...dto,
      sponsor: new Types.ObjectId(sponsor._id),
    });

    // SI TYPE = REDUCTION → générer coupon + QR code
    if (dto.type === 'reduction') {
      const coupon = Math.random().toString(36).substring(2, 10).toUpperCase();

      const qr = await this.qrCodeService.generateQrCode(coupon);

      pub.coupon = coupon;
      pub.qrCode = qr;
    }

    const saved = await pub.save();
    await saved.populate('sponsor', 'username email role image');
    return this.transformPublicite(saved);
  }

  private transformPubliciteType(type: string): string {
    const typeLower = type?.toLowerCase() || '';
    switch (typeLower) {
      case 'reduction':
      case 'réduction':
        return 'REDUCTION';
      case 'promotion':
      case 'promo':
        return 'PROMOTION';
      case 'jeu':
      case 'game':
        return 'JEU';
      default:
        return 'PROMOTION';
    }
  }

  private transformPublicite(pub: any) {
    if (!pub) return pub;

    const t = pub.toObject ? pub.toObject() : { ...pub };

    if (t.type) t.type = this.transformPubliciteType(t.type);

    t.sponsorId = t.sponsor?._id?.toString() || t.sponsor?.toString() || 'unknown';
    t.sponsorName = t.sponsor?.username || null;
    t.sponsorLogo = t.sponsor?.image || null;

    t.imageUrl = t.image;

    if (!t.categorie) t.categorie = 'TOUT';
    if (!t.dateExpiration) t.dateExpiration = null;

    return t;
  }

  async findAll() {
    const pubs = await this.model.find().populate('sponsor', 'username email role image');
    return pubs.map(pub => this.transformPublicite(pub));
  }

  async findById(id: string) {
    const pub = await this.model.findById(id).populate('sponsor');
    if (!pub) return null;
    return this.transformPublicite(pub);
  }

  async findOne(id: string) {
    const pub = await this.model.findById(id).populate('sponsor');
    if (!pub) throw new NotFoundException(`Publicité #${id} not found`);
    return this.transformPublicite(pub);
  }

  async update(id: string, dto: UpdatePubliciteDto, userPayload: any) {
    const pub = await this.model.findById(id);
    if (!pub) throw new NotFoundException('Publicité non trouvée');

    const sponsor = await this.userModel.findById(userPayload.userId);
    if (!sponsor) throw new ForbiddenException('Authenticated user not found');

    if (pub.sponsor.toString() !== sponsor._id.toString())
      throw new ForbiddenException('Vous ne pouvez pas modifier cette publicité');

    Object.assign(pub, dto);

    const updated = await pub.save();
    await updated.populate('sponsor');
    return this.transformPublicite(updated);
  }

  async remove(id: string, userPayload: any) {
    const pub = await this.model.findById(id);
    if (!pub) throw new NotFoundException('Publicité non trouvée');

    const sponsor = await this.userModel.findById(userPayload.userId);
    if (!sponsor) throw new ForbiddenException('Authenticated user not found');

    if (pub.sponsor.toString() !== sponsor._id.toString())
      throw new ForbiddenException('Vous ne pouvez pas supprimer cette publicité');

    await pub.deleteOne();
    return { message: 'Publicité deleted successfully' };
  }
}
