import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    departmentId?: string;
    courseId?: string;
    level?: number;
    search?: string;
    isEnrolled?: boolean;
  }) {
    const { page = 1, limit = 10, departmentId, courseId, level, search, isEnrolled } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (courseId) where.courseId = courseId;
    if (level) where.currentLevel = level;
    if (isEnrolled !== undefined) where.isEnrolled = isEnrolled;
    if (search) {
      where.OR = [
        { studentId: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatarUrl: true,
            },
          },
          department: true,
          course: true,
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        department: true,
        course: true,
        clearanceRequests: {
          include: {
            semester: true,
            approvals: {
              include: {
                officer: {
                  select: { firstName: true, lastName: true, role: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        examEligibilities: {
          include: { semester: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async findByUserId(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        department: true,
        course: true,
        clearanceRequests: {
          include: {
            semester: true,
            approvals: {
              include: {
                officer: {
                  select: { firstName: true, lastName: true, role: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return student;
  }

  async create(data: {
    userId: string;
    studentId: string;
    departmentId: string;
    courseId?: string;
    currentLevel?: number;
    yearOfEntry?: number;
  }) {
    const existing = await this.prisma.student.findUnique({
      where: { studentId: data.studentId },
    });

    if (existing) {
      throw new ConflictException('Student ID already exists');
    }

    return this.prisma.student.create({
      data: {
        userId: data.userId,
        studentId: data.studentId,
        departmentId: data.departmentId,
        courseId: data.courseId,
        currentLevel: data.currentLevel || 100,
        yearOfEntry: data.yearOfEntry,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        department: true,
        course: true,
      },
    });
  }

  async update(id: string, data: any) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.student.update({
      where: { id },
      data,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        department: true,
        course: true,
      },
    });
  }
}
