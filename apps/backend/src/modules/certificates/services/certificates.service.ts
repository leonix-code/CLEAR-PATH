import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByStudent(userId: string) {
    return this.prisma.certificate.findMany({ where: { studentId: userId }, orderBy: { issuedAt: 'desc' } });
  }

  async verify(certificateId: string) {
    const cert = await this.prisma.certificate.findUnique({ where: { certificateId } });
    if (!cert) throw new NotFoundException('Certificate not found');
    return { verified: cert.isVerified, certificate: cert };
  }
}
