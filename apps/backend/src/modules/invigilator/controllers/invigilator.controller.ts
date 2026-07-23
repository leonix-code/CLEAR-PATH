import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvigilatorService } from '../services/invigilator.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Invigilator')
@Controller({ path: 'invigilator', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class InvigilatorController {
  constructor(private readonly invigilatorService: InvigilatorService) {}

  @Get('eligible-students')
  @Roles(UserRole.INVIGILATOR, UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Get eligible students for exams' })
  async getEligibleStudents(@Query('semesterId') semesterId?: string) {
    return this.invigilatorService.getEligibleStudents(semesterId);
  }

  @Post('verify-qr')
  @Roles(UserRole.INVIGILATOR)
  @ApiOperation({ summary: 'Verify student QR code' })
  async verifyQR(@Body('data') data: string, @Body('signature') signature: string) {
    return this.invigilatorService.verifyQR(data, signature);
  }
}
