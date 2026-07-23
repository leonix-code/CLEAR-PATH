import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OfficersService } from '../services/officers.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Officers')
@Controller({ path: 'officers', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class OfficersController {
  constructor(private readonly officersService: OfficersService) {}

  @Get('pending')
  @Roles(UserRole.FINANCE_OFFICER, UserRole.LIBRARY_OFFICER, UserRole.LABORATORY_OFFICER, UserRole.SPORTS_OFFICER, UserRole.DEPARTMENT_OFFICER)
  @ApiOperation({ summary: 'Get pending clearance requests for officer' })
  async getPending(@Query('officerId') officerId: string) {
    return this.officersService.getPending(officerId);
  }
}
