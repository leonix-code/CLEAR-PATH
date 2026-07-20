import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, totalStudents, totalDepartments, totalClearances, approvedClearances, pendingClearances, rejectedClearances, totalOfficers] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.student.count(),
      this.prisma.department.count({ where: { isActive: true } }),
      this.prisma.clearanceRequest.count(),
      this.prisma.clearanceRequest.count({ where: { status: 'APPROVED' } }),
      this.prisma.clearanceRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.clearanceRequest.count({ where: { status: 'REJECTED' } }),
      this.prisma.user.count({ where: { role: { in: ['FINANCE_OFFICER', 'LIBRARY_OFFICER', 'LABORATORY_OFFICER', 'SPORTS_OFFICER', 'DEPARTMENT_OFFICER'] } } }),
    ]);

    const approvalRate = totalClearances > 0 ? ((approvedClearances / totalClearances) * 100).toFixed(1) : '0';

    return { totalUsers, totalStudents, totalDepartments, totalClearances, approvedClearances, pendingClearances, rejectedClearances, totalOfficers, approvalRate };
  }

  async getClearanceTrend(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const clearances = await this.prisma.clearanceRequest.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const trend: Record<string, { date: string; total: number; approved: number; rejected: number }> = {};
    for (const c of clearances) {
      const dateKey = c.createdAt.toISOString().split('T')[0];
      if (!trend[dateKey]) trend[dateKey] = { date: dateKey, total: 0, approved: 0, rejected: 0 };
      trend[dateKey].total++;
      if (c.status === 'APPROVED') trend[dateKey].approved++;
      if (c.status === 'REJECTED') trend[dateKey].rejected++;
    }

    return Object.values(trend);
  }

  async getDepartmentStats() {
    const departments = await this.prisma.department.findMany({
      include: {
        _count: { select: { students: true } },
      },
    });

    const stats = await Promise.all(
      departments.map(async (dept) => {
        const clearances = await this.prisma.clearanceRequest.count({
          where: { student: { departmentId: dept.id } },
        });
        const approved = await this.prisma.clearanceRequest.count({
          where: { student: { departmentId: dept.id }, status: 'APPROVED' },
        });
        return {
          id: dept.id,
          name: dept.name,
          code: dept.code,
          students: dept._count.students,
          clearances,
          approved,
          rate: clearances > 0 ? ((approved / clearances) * 100).toFixed(1) : '0',
        };
      })
    );

    return stats;
  }
}
