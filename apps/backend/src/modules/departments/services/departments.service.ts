import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    const { page = 1, limit = 10, search, isActive } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [departments, total] = await Promise.all([
      this.prisma.department.findMany({
        where, skip, take: limit,
        orderBy: { name: 'asc' },
        include: {
          head: { select: { firstName: true, lastName: true, email: true } },
          _count: { select: { students: true, courses: true } },
        },
      }),
      this.prisma.department.count({ where }),
    ]);

    return { data: departments, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        head: { select: { id: true, firstName: true, lastName: true, email: true } },
        courses: { where: { isActive: true } },
        _count: { select: { students: true } },
      },
    });
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async create(data: { name: string; code: string; description?: string; headId?: string }) {
    return this.prisma.department.create({ data, include: { head: { select: { firstName: true, lastName: true } } } });
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.prisma.department.update({ where: { id }, data });
  }
}
