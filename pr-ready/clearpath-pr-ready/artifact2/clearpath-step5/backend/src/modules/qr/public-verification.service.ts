import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QrSigningService } from './qr-signing.service';

@Injectable()
export class PublicVerificationService {
  constructor(private readonly prisma: PrismaService, private readonly signing: QrSigningService) {}
  async verify(code: string) {
    const { certificateId } = this.signing.verifyCode(code);
    const certificate = await this.prisma.certificate.findUnique({
      where: { certificateId },
      select: { certificateId: true, title: true, certificateType: true, issuedAt: true, expiresAt: true, isVerified: true, student: { select: { studentId: true, user: { select: { firstName: true, lastName: true } } } } },
    });
    if (!certificate) throw new NotFoundException('Certificate not found');
    const expired = certificate.expiresAt !== null && certificate.expiresAt < new Date();
    return { valid: certificate.isVerified && !expired, certificate: { ...certificate, student: { studentId: certificate.student.studentId, name: `${certificate.student.user.firstName} ${certificate.student.user.lastName}` } } };
  }
}
