import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

export interface QrCodeItem {
  id: number;
  data: string;
  qrCodeImage: string;
}

@Injectable()
export class QrCodeService {
  private qrcodes: QrCodeItem[] = [];

  // Génération simple pour usage externe (publicité, coupon…)
  async generateQrCode(text: string) {
    return QRCode.toDataURL(text);
  }

  // CREATE
  async create(data: any) {
    const id = this.qrcodes.length + 1;
    const qrData = data.text || `QR-${id}`;

    const qrCodeImage = await QRCode.toDataURL(qrData);

    const newQr: QrCodeItem = {
      id,
      data: qrData,
      qrCodeImage,
    };

    this.qrcodes.push(newQr);
    return newQr;
  }

  // READ ALL
  findAll() {
    return this.qrcodes;
  }

  // READ ONE
  findOne(id: number) {
    return this.qrcodes.find(q => q.id === id);
  }

  // UPDATE
  update(id: number, updateData: any) {
    const index = this.qrcodes.findIndex(q => q.id === id);
    if (index === -1) return null;

    const qrData = updateData.text || this.qrcodes[index].data;

    this.qrcodes[index].data = qrData;

    return this.qrcodes[index];
  }

  // DELETE
  remove(id: number) {
    this.qrcodes = this.qrcodes.filter(q => q.id !== id);
    return { deleted: true };
  }
}

