import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Analytics')
@Controller({ path: 'analytics', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats() { return this.analyticsService.getDashboardStats(); }

  @Get('clearance-trend')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Get clearance trend data' })
  async getClearanceTrend(@Query('days') days?: number) { return this.analyticsService.getClearanceTrend(days); }

  @Get('departments')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Get department statistics' })
  async getDepartmentStats() { return this.analyticsService.getDepartmentStats(); }
}
