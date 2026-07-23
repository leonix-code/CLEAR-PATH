import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class QRService {
  constructor(private readonly prisma: PrismaService) {}

  async verify(code: string) {
    const qr = await this.prisma.qRCode.findUnique({ where: { code } });
    if (!qr || !qr.isActive) throw new NotFoundException('Invalid QR code');
    return { valid: true, data: qr.data, purpose: qr.purpose };
  }
}
