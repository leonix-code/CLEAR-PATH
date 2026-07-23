import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Response } from 'express';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReportData(filters: { type: string; startDate?: string; endDate?: string; departmentId?: string; status?: string }) {
    const where: Record<string, any> = {};
    if (filters.departmentId) where.student = { departmentId: filters.departmentId };
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }
    let data: any[] = [];
    switch (filters.type) {
      case 'clearances':
        data = await this.prisma.clearanceRequest.findMany({ where, include: { student: { include: { user: { select: { firstName: true, lastName: true } }, department: true } }, semester: true }, orderBy: { createdAt: 'desc' }, take: 1000 });
        break;
      case 'students':
        data = await this.prisma.student.findMany({ where: filters.departmentId ? { departmentId: filters.departmentId } : undefined, include: { user: { select: { firstName: true, lastName: true, email: true } }, department: true }, take: 1000 });
        break;
    }
    return { data, summary: { total: data.length } };
  }

  generateCSV(rows: any[], columns: { key: string; label: string }[]): string {
    const escape = (val: any) => '"' + String(val || '').replace(/"/g, '""') + '"';
    const header = columns.map(c => escape(c.label)).join(',');
    const body = rows.map(row => columns.map(c => escape(row[c.key])).join(','));
    return [header, ...body].join('\n');
  }

  async exportCSV(res: Response, type: string, filters: any) {
    const csv = this.generateCSV([], []);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="' + type + '-' + Date.now() + '.csv"');
    res.send(csv);
  }

  async exportExcel(res: Response, type: string, filters: any) {
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.send('<html><body><h1>' + type + ' Report</h1></body></html>');
  }

  async exportPDF(res: Response, type: string, filters: any) {
    res.setHeader('Content-Type', 'text/html');
    res.send('<html><body><h1>' + type + ' Report</h1></body></html>');
  }
}
