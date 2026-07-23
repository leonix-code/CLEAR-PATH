import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class InvigilatorService {
  constructor(private readonly prisma: PrismaService) {}

  async getEligibleStudents(semesterId?: string) {
    return this.prisma.examEligibility.findMany({
      where: {
        status: 'ELIGIBLE',
        ...(semesterId ? { semesterId } : {}),
      },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } }, department: true, course: true } },
        semester: true,
      },
    });
  }

  async verifyQR(data: string, signature: string) {
    const secret = process.env.QR_SECRET || 'clearpath-default-secret';
    const expected = crypto.createHmac('sha256', secret).update(data).digest('hex').substring(0, 16);
    const valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    if (!valid) throw new BadRequestException('Invalid QR code');
    return { valid: true, data: JSON.parse(data) };
  }
}
