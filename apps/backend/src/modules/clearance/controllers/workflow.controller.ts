import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowEngineService } from '../services/workflow-engine.service';
import { ReportsService } from '../services/reports.service';
import { NotificationChannelService } from '../services/notification-channel.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { UserRole, NotificationType } from '@prisma/client';
import { Response } from 'express';
import { Res } from '@nestjs/common';

@ApiTags('Workflow')
@Controller({ path: 'workflow', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class WorkflowController {
  constructor(
    private readonly workflowEngine: WorkflowEngineService,
    private readonly reportsService: ReportsService,
    private readonly notificationChannel: NotificationChannelService,
  ) {}

  @Get('timeline/:id')
  @ApiOperation({ summary: 'Get workflow timeline for clearance' })
  async getTimeline(@Param('id') id: string) {
    return this.workflowEngine.getWorkflowTimeline(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.FINANCE_OFFICER, UserRole.LIBRARY_OFFICER, UserRole.LABORATORY_OFFICER, UserRole.SPORTS_OFFICER, UserRole.DEPARTMENT_OFFICER, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Approve clearance stage' })
  async approve(@GetUser('id') userId: string, @Param('id') id: string, @Body('remarks') remarks?: string) {
    return this.workflowEngine.approveStage(userId, id, remarks);
  }

  @Patch(':id/reject')
  @Roles(UserRole.FINANCE_OFFICER, UserRole.LIBRARY_OFFICER, UserRole.LABORATORY_OFFICER, UserRole.SPORTS_OFFICER, UserRole.DEPARTMENT_OFFICER, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Reject clearance stage' })
  async reject(@GetUser('id') userId: string, @Param('id') id: string, @Body('remarks') remarks: string) {
    return this.workflowEngine.rejectStage(userId, id, remarks);
  }

  @Patch(':id/conditional')
  @Roles(UserRole.FINANCE_OFFICER, UserRole.LIBRARY_OFFICER, UserRole.LABORATORY_OFFICER, UserRole.SPORTS_OFFICER, UserRole.DEPARTMENT_OFFICER)
  @ApiOperation({ summary: 'Conditionally approve clearance stage' })
  async conditionalApprove(@GetUser('id') userId: string, @Param('id') id: string, @Body('remarks') remarks: string) {
    return this.workflowEngine.conditionallyApprove(userId, id, remarks);
  }

  @Post(':id/notify')
  @ApiOperation({ summary: 'Send notification about clearance' })
  async sendNotification(@Param('id') id: string, @Body('template') template: string, @Body('channels') channels?: NotificationType[]) {
    const clearance = await this.workflowEngine.findById(id);
    if (!clearance) return { error: 'Clearance not found' };
    await this.notificationChannel.sendTemplate(template, clearance.studentId, {
      stage: 'Clearance', semester: clearance.semester?.name || '', reason: '',
    }, { channels, referenceType: 'clearance', referenceId: id });
    return { sent: true };
  }

  @Get('verify-qr')
  @ApiOperation({ summary: 'Verify QR code data integrity' })
  async verifyQR(@Query('data') data: string, @Query('signature') signature: string) {
    const valid = this.workflowEngine.verifySignature(data, signature);
    return { valid, data: valid ? JSON.parse(data) : null };
  }

  @Get('reports/:type/csv')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPERVISOR, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Export report as CSV' })
  async exportCSV(@Param('type') type: string, @Query() filters: any, @Res() res: Response) {
    return this.reportsService.exportCSV(res, type, filters);
  }

  @Get('reports/:type/excel')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPERVISOR, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Export report as Excel' })
  async exportExcel(@Param('type') type: string, @Query() filters: any, @Res() res: Response) {
    return this.reportsService.exportExcel(res, type, filters);
  }

  @Get('reports/:type/pdf')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPERVISOR, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Export report as PDF' })
  async exportPDF(@Param('type') type: string, @Query() filters: any, @Res() res: Response) {
    return this.reportsService.exportPDF(res, type, filters);
  }
}
