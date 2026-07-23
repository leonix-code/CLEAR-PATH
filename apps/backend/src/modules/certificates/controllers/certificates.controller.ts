import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CertificatesService } from '../services/certificates.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Certificates')
@Controller({ path: 'certificates', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('my')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my certificates' })
  async getMyCertificates(@GetUser('id') userId: string) { return this.certificatesService.findByStudent(userId); }

  @Get('verify/:certId')
  @ApiOperation({ summary: 'Verify a certificate by ID' })
  async verify(@Param('certId') certId: string) { return this.certificatesService.verify(certId); }
}
