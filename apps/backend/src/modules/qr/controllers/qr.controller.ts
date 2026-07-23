import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QRService } from '../services/qr.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('QR')
@Controller({ path: 'qr', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class QRController {
  constructor(private readonly qrService: QRService) {}

  @Get('verify/:code')
  @Roles(UserRole.INVIGILATOR, UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Verify a QR code' })
  async verify(@Param('code') code: string) { return this.qrService.verify(code); }
}
