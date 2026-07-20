import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClearanceService } from '../services/clearance.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Clearance')
@Controller({ path: 'clearance', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ClearanceController {
  constructor(private readonly clearanceService: ClearanceService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Submit clearance request' })
  async create(
    @GetUser('id') userId: string,
    @Body('semesterId') semesterId: string,
  ) {
    const student = await this.clearanceService['prisma'].student.findUnique({ where: { userId } });
    return this.clearanceService.create(student.id, semesterId);
  }

  @Get()
  @Roles(UserRole.ADMINISTRATOR, UserRole.DEPARTMENT_OFFICER, UserRole.ICT_SUPPORT, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Get all clearance requests' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: any,
    @Query('departmentId') departmentId?: string,
    @Query('semesterId') semesterId?: string,
    @Query('search') search?: string,
  ) {
    return this.clearanceService.findAll({ page, limit, status, departmentId, semesterId, search });
  }

  @Get('my-requests')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my clearance requests' })
  async getMyRequests(@GetUser('id') userId: string) {
    const student = await this.clearanceService['prisma'].student.findUnique({ where: { userId } });
    if (!student) return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    return this.clearanceService.findAll({ studentId: student.id });
  }

  @Get('pending')
  @Roles(UserRole.FINANCE_OFFICER, UserRole.LIBRARY_OFFICER, UserRole.LABORATORY_OFFICER, UserRole.SPORTS_OFFICER, UserRole.DEPARTMENT_OFFICER)
  @ApiOperation({ summary: 'Get pending clearance requests for officer' })
  async getPending(@GetUser('id') userId: string) {
    return this.clearanceService.findAll({ officerId: userId, status: 'PENDING' });
  }

  @Get('statistics')
  @Roles(UserRole.ADMINISTRATOR, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Get clearance statistics' })
  async getStatistics() {
    return this.clearanceService.getStatistics();
  }

  @Get(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.STUDENT, UserRole.DEPARTMENT_OFFICER, UserRole.ICT_SUPPORT)
  @ApiOperation({ summary: 'Get clearance request by ID' })
  async findById(@Param('id') id: string) {
    return this.clearanceService.findById(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.FINANCE_OFFICER, UserRole.LIBRARY_OFFICER, UserRole.LABORATORY_OFFICER, UserRole.SPORTS_OFFICER, UserRole.DEPARTMENT_OFFICER)
  @ApiOperation({ summary: 'Approve clearance request' })
  async approve(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body('remarks') remarks?: string,
  ) {
    return this.clearanceService.approve(userId, id, remarks);
  }

  @Patch(':id/reject')
  @Roles(UserRole.FINANCE_OFFICER, UserRole.LIBRARY_OFFICER, UserRole.LABORATORY_OFFICER, UserRole.SPORTS_OFFICER, UserRole.DEPARTMENT_OFFICER)
  @ApiOperation({ summary: 'Reject clearance request' })
  async reject(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body('remarks') remarks: string,
  ) {
    return this.clearanceService.reject(userId, id, remarks);
  }

  @Post('bulk-approve')
  @Roles(UserRole.FINANCE_OFFICER, UserRole.LIBRARY_OFFICER, UserRole.LABORATORY_OFFICER, UserRole.SPORTS_OFFICER, UserRole.DEPARTMENT_OFFICER)
  @ApiOperation({ summary: 'Bulk approve clearance requests' })
  async bulkApprove(
    @GetUser('id') userId: string,
    @Body('ids') ids: string[],
    @Body('remarks') remarks?: string,
  ) {
    return this.clearanceService.bulkApprove(userId, ids, remarks);
  }
}
