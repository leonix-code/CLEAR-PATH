import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Response } from 'express';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getReportData(filters: { type: string; startDate?: string; endDate?: string; departmentId?: string; status?: string }) {
    const where: any = {};
    if (filters.departmentId) where.student = { departmentId: filters.departmentId };
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    let data: any[] = [];
    let summary: any = {};

    switch (filters.type) {
      case 'clearances':
        data = await this.prisma.clearanceRequest.findMany({
          where,
          include: { student: { include: { user: { select: { firstName: true, lastName: true } }, department: true } }, semester: true },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        });
        summary = { total: data.length, approved: data.filter(d => d.status === 'APPROVED').length, pending: data.filter(d => d.status === 'PENDING').length, rejected: data.filter(d => d.status === 'REJECTED').length };
        break;
      case 'students':
        data = await this.prisma.student.findMany({
          where: filters.departmentId ? { departmentId: filters.departmentId } : undefined,
          include: { user: { select: { firstName: true, lastName: true, email: true } }, department: true },
          take: 1000,
        });
        summary = { total: data.length };
        break;
      case 'audit':
        data = await this.prisma.auditLog.findMany({
          where: filters.startDate ? { createdAt: { gte: new Date(filters.startDate) } } : undefined,
          orderBy: { createdAt: 'desc' },
          take: 500,
        });
        summary = { total: data.length };
        break;
    }
    return { data, summary };
  }

  generateCSV(rows: any[], columns: { key: string; label: string }[]): string {
    const escape = (val: any) => '"' + String(val || '').replace(/"/g, '""') + '"';
    const header = columns.map(c => escape(c.label)).join(',');
    const body = rows.map(row => columns.map(c => escape(row[c.key])).join(','));
    return [header, ...body].join('\n');
  }

  async exportCSV(res: Response, type: string, filters: any) {
    const { data, columns } = await this.getExportData(type, filters);
    const csv = this.generateCSV(data, columns);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="' + type + '-' + Date.now() + '.csv"');
    res.send(csv);
  }

  async exportExcel(res: Response, type: string, filters: any) {
    const { data, columns, title } = await this.getExportData(type, filters);
    let html = '<html><head><meta charset="utf-8"><title>' + title + '</title></head><body>';
    html += '<h1>' + title + '</h1>';
    html += '<table><thead><tr>' + columns.map(c => '<th>' + c.label + '</th>').join('') + '</tr></thead>';
    html += '<tbody>' + data.map((row: any) => '<tr>' + columns.map(c => '<td>' + (row[c.key] || '') + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
    html += '</body></html>';
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', 'attachment; filename="' + type + '-' + Date.now() + '.xls"');
    res.send(html);
  }

  private async getExportData(type: string, filters: any) {
    const report = await this.getReportData({ type, ...filters });
    let columns: { key: string; label: string }[] = [];
    let title = '';

    switch (type) {
      case 'clearances':
        columns = [{ key: 'first', label: 'Name' }, { key: 'id', label: 'ID' }, { key: 'dept', label: 'Department' }, { key: 'status', label: 'Status' }, { key: 'date', label: 'Date' }];
        title = 'Clearance Requests Report';
        const flatData = report.data.map((d: any) => ({
          first: (d.student?.user?.firstName || '') + ' ' + (d.student?.user?.lastName || ''),
          id: d.student?.studentId || '',
          dept: d.student?.department?.name || '',
          status: d.status,
          date: d.submittedAt?.toISOString?.()?.split('T')[0] || '',
        }));
        return { data: flatData, columns, title };
      case 'students':
        columns = [{ key: 'name', label: 'Name' }, { key: 'id', label: 'Student ID' }, { key: 'dept', label: 'Department' }, { key: 'email', label: 'Email' }];
        title = 'Students Report';
        const flatStudents = report.data.map((d: any) => ({
          name: (d.user?.firstName || '') + ' ' + (d.user?.lastName || ''),
          id: d.studentId || '',
          dept: d.department?.name || '',
          email: d.user?.email || '',
        }));
        return { data: flatStudents, columns, title };
      case 'audit':
        columns = [{ key: 'action', label: 'Action' }, { key: 'entity', label: 'Entity' }, { key: 'date', label: 'Date' }];
        title = 'Audit Log Report';
        const flatAudit = report.data.map((d: any) => ({
          action: d.action,
          entity: d.entity,
          date: d.createdAt?.toISOString?.()?.split('T')[0] || '',
        }));
        return { data: flatAudit, columns, title };
      default:
        return { data: [], columns: [], title: 'Report' };
    }
  }
}
