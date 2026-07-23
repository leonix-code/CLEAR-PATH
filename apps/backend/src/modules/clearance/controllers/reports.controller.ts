import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from '../services/reports.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Response } from 'express';

@ApiTags('Reports')
@Controller({ path: 'reports', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('data')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPERVISOR, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Get report data' })
  async getData(@Query('type') type: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string, @Query('departmentId') departmentId?: string, @Query('status') status?: string) {
    return this.reportsService.getReportData({ type, startDate, endDate, departmentId, status });
  }

  @Get('export/csv')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPERVISOR, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Export CSV report' })
  async exportCSV(@Query() filters: any, @Res() res: Response) {
    return this.reportsService.exportCSV(res, filters.type || 'clearances', filters);
  }

  @Get('export/excel')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPERVISOR, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Export Excel report' })
  async exportExcel(@Query() filters: any, @Res() res: Response) {
    return this.reportsService.exportExcel(res, filters.type || 'clearances', filters);
  }

  @Get('export/pdf')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPERVISOR, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Export PDF report (HTML format)' })
  async exportPDF(@Query() filters: any, @Res() res: Response) {
    return this.reportsService.exportPDF(res, filters.type || 'clearances', filters);
  }
}
