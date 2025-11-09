import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Publicite, PubliciteDocument } from './schemas/publicite.schema';
import { CreatePubliciteDto } from './dto/create-publicite.dto';
import { UpdatePubliciteDto } from './dto/update-publicite.dto';

@Injectable()
export class PubliciteService {
  constructor(
    @InjectModel(Publicite.name)
    private readonly pubModel: Model<PubliciteDocument>,
  ) {}

  // -------------------- CREATE --------------------
  async create(dto: CreatePubliciteDto, sponsorId: string) {
    const pub = new this.pubModel({
      titre: dto.titre,
      description: dto.description,
      type: dto.type,
      pourcentageReduction: dto.pourcentageReduction ?? null,
      imageUrl: dto.imageUrl ?? null,
      dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : new Date(),
      dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
      partenaire: sponsorId,        // ✅ assigné automatiquement
    });

    return pub.save();
  }

  // -------------------- GET ALL ACTIVE --------------------
  async findAllActive() {
  return this.pubModel
    .find() // <-- pas de filtre pour tester
    .sort({ createdAt: -1 })
    .populate({
      path: 'partenaire',
      select: 'username email role'
    })
    .exec();
}


  // -------------------- GET ONE --------------------
  async findOne(id: string) {
    const pub = await this.pubModel.findById(id).populate('partenaire');
  
    if (!pub) throw new NotFoundException('Publicité introuvable');
  
    return pub;
  }

  // -------------------- UPDATE --------------------
  async update(id: string, dto: UpdatePubliciteDto, sponsorId: string) {
    const pub = await this.pubModel.findById(id);
  
    if (!pub) throw new NotFoundException('Publicité introuvable');

    if (pub.partenaire.toString() !== sponsorId)
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres publicités');
  
    Object.assign(pub, dto);
  
    return pub.save();
  }

  // -------------------- DELETE --------------------
  async remove(id: string, sponsorId: string) {
    const pub = await this.pubModel.findById(id);
  
    if (!pub) throw new NotFoundException('Publicité introuvable');
  
    if (pub.partenaire.toString() !== sponsorId)
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres publicités');
  
    await pub.deleteOne();
  
    return { message: 'Publicité supprimée avec succès' };
  }
}
