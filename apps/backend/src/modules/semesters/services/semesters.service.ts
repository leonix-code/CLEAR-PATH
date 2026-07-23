import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SemestersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() { return this.prisma.semester.findMany({ include: { academicYear: true }, orderBy: { createdAt: 'desc' } }); }
  async getCurrent() { return this.prisma.semester.findFirst({ where: { isCurrent: true }, include: { academicYear: true } }); }
}
