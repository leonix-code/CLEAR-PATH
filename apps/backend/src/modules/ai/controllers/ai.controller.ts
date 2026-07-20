import {
  Controller, Get, Post, Body, Query, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AIService } from '../services/ai.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';

@ApiTags('AI')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'ai', version: '1' })
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Chat with AI assistant',
    description: 'Send messages to the AI assistant and get intelligent responses about clearance, workflow, and system operations.',
  })
  async chat(
    @GetUser('id') userId: string,
    @Body() body: { messages: { role: 'user' | 'assistant'; content: string }[] },
  ) {
    return this.aiService.chat(userId, body.messages);
  }

  @Get('search')
  @ApiOperation({ summary: 'Natural language search', description: 'Search students, clearances, and departments using natural language queries.' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type (student|clearance|department)' })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async search(
    @GetUser('id') userId: string,
    @Query('q') query: string,
    @Query('type') type?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.aiService.naturalLanguageSearch(userId, query, { type, departmentId, status });
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get AI recommendations', description: 'Get personalized recommendations and insights based on user role and clearance status.' })
  async getRecommendations(@GetUser('id') userId: string) {
    return this.aiService.getRecommendations(userId);
  }

  @Get('recommendations/:userId')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Get recommendations for a specific user', description: 'Get personalized recommendations for any user (admin use).' })
  async getRecommendationsForUser(@Param('userId') userId: string) {
    return this.aiService.getRecommendations(userId);
  }

  @Get('predictive')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPERVISOR, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Get predictive analytics', description: 'Get predictive insights including clearance trends, bottleneck detection, and completion forecasts.' })
  async getPredictiveAnalytics() {
    return this.aiService.getPredictiveAnalytics();
  }

  @Get('smart-reports')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPERVISOR, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Get smart reports', description: 'Get AI-powered smart reports with stage analysis, department distribution, and clearance insights.' })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getSmartReports(
    @Query('departmentId') departmentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.aiService.getSmartReports({ departmentId, startDate, endDate });
  }
}
