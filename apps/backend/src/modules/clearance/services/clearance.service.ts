import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ClearanceStatus, ApprovalStatus } from '@prisma/client';

@Injectable()
export class ClearanceService {
  private readonly logger = new Logger(ClearanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(studentId: string, semesterId: string) {
    const existing = await this.prisma.clearanceRequest.findUnique({
      where: {
        studentId_semesterId: { studentId, semesterId },
      },
    });

    if (existing) {
      throw new BadRequestException('Clearance request already exists for this semester');
    }

    const clearance = await this.prisma.clearanceRequest.create({
      data: {
        studentId,
        semesterId,
        status: ClearanceStatus.PENDING,
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            department: true,
            course: true,
          },
        },
        semester: true,
      },
    });

    // Create approval tasks for all officer roles
    const officers = await this.prisma.user.findMany({
      where: {
        role: {
          in: ['FINANCE_OFFICER', 'LIBRARY_OFFICER', 'LABORATORY_OFFICER', 'SPORTS_OFFICER', 'DEPARTMENT_OFFICER'],
        },
        isActive: true,
      },
    });

    for (const officer of officers) {
      await this.prisma.clearanceApproval.create({
        data: {
          clearanceRequestId: clearance.id,
          officerId: officer.id,
          status: ApprovalStatus.PENDING,
        },
      });
    }

    return clearance;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: ClearanceStatus;
    departmentId?: string;
    semesterId?: string;
    search?: string;
    studentId?: string;
    officerId?: string;
  }) {
    const { page = 1, limit = 10, status, departmentId, semesterId, search, studentId, officerId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (semesterId) where.semesterId = semesterId;
    if (studentId) where.studentId = studentId;
    if (departmentId) where.student = { departmentId };
    if (officerId) {
      where.approvals = { some: { officerId } };
    }
    if (search) {
      where.student = {
        OR: [
          { studentId: { contains: search, mode: 'insensitive' } },
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
        ],
      };
    }

    const [clearances, total] = await Promise.all([
      this.prisma.clearanceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
              department: true,
              course: true,
            },
          },
          semester: {
            include: { academicYear: true },
          },
          approvals: {
            include: {
              officer: { select: { firstName: true, lastName: true, role: true } },
            },
          },
        },
      }),
      this.prisma.clearanceRequest.count({ where }),
    ]);

    return {
      data: clearances,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const clearance = await this.prisma.clearanceRequest.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
            department: true,
            course: true,
          },
        },
        semester: {
          include: { academicYear: true },
        },
        approvals: {
          include: {
            officer: { select: { firstName: true, lastName: true, role: true } },
          },
        },
        examEligibilities: true,
      },
    });

    if (!clearance) {
      throw new NotFoundException('Clearance request not found');
    }

    return clearance;
  }

  async approve(officerId: string, clearanceRequestId: string, remarks?: string) {
    const approval = await this.prisma.clearanceApproval.findUnique({
      where: {
        clearanceRequestId_officerId: { clearanceRequestId, officerId },
      },
    });

    if (!approval) {
      throw new NotFoundException('Approval task not found');
    }

    const updated = await this.prisma.clearanceApproval.update({
      where: { id: approval.id },
      data: {
        status: ApprovalStatus.APPROVED,
        remarks,
        approvedAt: new Date(),
      },
    });

    // Check if all approvals are done
    await this.updateClearanceStatus(clearanceRequestId);

    return updated;
  }

  async reject(officerId: string, clearanceRequestId: string, remarks: string) {
    const approval = await this.prisma.clearanceApproval.findUnique({
      where: {
        clearanceRequestId_officerId: { clearanceRequestId, officerId },
      },
    });

    if (!approval) {
      throw new NotFoundException('Approval task not found');
    }

    const updated = await this.prisma.clearanceApproval.update({
      where: { id: approval.id },
      data: {
        status: ApprovalStatus.REJECTED,
        remarks,
        approvedAt: new Date(),
      },
    });

    await this.updateClearanceStatus(clearanceRequestId);

    return updated;
  }

  async bulkApprove(officerId: string, clearanceIds: string[], remarks?: string) {
    const results = [];
    for (const id of clearanceIds) {
      try {
        const result = await this.approve(officerId, id, remarks);
        results.push({ id, status: 'approved' });
      } catch (error) {
        results.push({ id, status: 'failed', error: error.message });
      }
    }
    return results;
  }

  private async updateClearanceStatus(clearanceRequestId: string) {
    const clearance = await this.prisma.clearanceRequest.findUnique({
      where: { id: clearanceRequestId },
      include: { approvals: true },
    });

    if (!clearance) return;

    const totalApprovals = clearance.approvals.length;
    const approvedCount = clearance.approvals.filter(a => a.status === ApprovalStatus.APPROVED).length;
    const rejectedCount = clearance.approvals.filter(a => a.status === ApprovalStatus.REJECTED).length;

    let newStatus: ClearanceStatus;
    if (rejectedCount > 0) {
      newStatus = ClearanceStatus.REJECTED;
    } else if (approvedCount === totalApprovals) {
      newStatus = ClearanceStatus.APPROVED;
    } else if (approvedCount > 0) {
      newStatus = ClearanceStatus.IN_PROGRESS;
    } else {
      newStatus = ClearanceStatus.PENDING;
    }

    await this.prisma.clearanceRequest.update({
      where: { id: clearanceRequestId },
      data: {
        status: newStatus,
        completedAt: newStatus === ClearanceStatus.APPROVED ? new Date() : undefined,
      },
    });
  }

  async getStatistics() {
    const [total, pending, inProgress, approved, rejected] = await Promise.all([
      this.prisma.clearanceRequest.count(),
      this.prisma.clearanceRequest.count({ where: { status: ClearanceStatus.PENDING } }),
      this.prisma.clearanceRequest.count({ where: { status: ClearanceStatus.IN_PROGRESS } }),
      this.prisma.clearanceRequest.count({ where: { status: ClearanceStatus.APPROVED } }),
      this.prisma.clearanceRequest.count({ where: { status: ClearanceStatus.REJECTED } }),
    ]);

    return { total, pending, inProgress, approved, rejected };
  }
}
