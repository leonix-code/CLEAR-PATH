import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; departmentId?: string; search?: string }) {
    const { page = 1, limit = 10, departmentId, search } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({ where, skip, take: limit, orderBy: { name: 'asc' }, include: { department: true, _count: { select: { students: true } } } }),
      this.prisma.course.count({ where }),
    ]);
    return { data: courses, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id }, include: { department: true } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async create(data: { name: string; code: string; departmentId: string; duration?: number }) {
    return this.prisma.course.create({ data, include: { department: true } });
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.prisma.course.update({ where: { id }, data });
  }
}
