import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() { return this.prisma.academicYear.findMany({ include: { semesters: true }, orderBy: { year: 'desc' } }); }
}
