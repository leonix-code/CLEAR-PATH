import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class OfficersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPending(officerId: string) {
    return this.prisma.clearanceApproval.findMany({
      where: { officerId, status: 'PENDING' },
      include: {
        clearanceRequest: {
          include: {
            student: { include: { user: { select: { firstName: true, lastName: true, email: true } }, department: true } },
            semester: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
