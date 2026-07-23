import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClearanceStatus, UserRole } from '@prisma/client';
import { ClearanceService } from '../services/clearance.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

@ApiTags('Clearance')
@Controller({ path: 'clearance', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ClearanceController {
  constructor(private readonly clearance: ClearanceService, private readonly prisma: PrismaService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Submit a clearance request for the authenticated student' })
  async create(@GetUser('id') userId: string, @Body('semesterId') semesterId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) return { data: null, error: 'Student profile not found' };
    return this.clearance.create(student.id, semesterId);
  }

  @Get('my-requests')
  @Roles(UserRole.STUDENT)
  async getMine(@GetUser('id') userId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    return this.clearance.findAll({ studentId: student.id, page, limit });
  }

  @Get('pending')
  @Roles(UserRole.FINANCE_OFFICER, UserRole.LIBRARY_OFFICER, UserRole.LABORATORY_OFFICER, UserRole.SPORTS_OFFICER, UserRole.HOSTEL_OFFICER, UserRole.DEPARTMENT_OFFICER, UserRole.REGISTRAR)
  async getPending(@GetUser('id') officerId: string, @GetUser('role') role: UserRole) {
    return this.clearance.findAll({ officerId, requiredRole: role, status: ClearanceStatus.PENDING });
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.REGISTRAR, UserRole.AUDITOR, UserRole.DEPARTMENT_HEAD)
  async findAll(@GetUser() actor: { id: string; role: UserRole; institutionId?: string }, @Query() query: any) {
    return this.clearance.findAll({ ...query, institutionId: actor.institutionId });
  }

  @Get(':id')
  @Roles(UserRole.STUDENT, UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.REGISTRAR, UserRole.AUDITOR, UserRole.DEPARTMENT_HEAD)
  async findById(@GetUser() actor: { id: string; role: UserRole }, @Param('id') id: string) {
    return this.clearance.findByIdForActor(id, actor);
  }

  @Patch(':id/approve')
  @Roles(UserRole.FINANCE_OFFICER, UserRole.LIBRARY_OFFICER, UserRole.LABORATORY_OFFICER, UserRole.SPORTS_OFFICER, UserRole.HOSTEL_OFFICER, UserRole.DEPARTMENT_OFFICER, UserRole.REGISTRAR)
  async approve(@GetUser() actor: { id: string; role: UserRole }, @Param('id') id: string, @Body('remarks') remarks?: string) {
    return this.clearance.act(actor, id, 'APPROVE', remarks);
  }

  @Patch(':id/reject')
  @Roles(UserRole.FINANCE_OFFICER, UserRole.LIBRARY_OFFICER, UserRole.LABORATORY_OFFICER, UserRole.SPORTS_OFFICER, UserRole.HOSTEL_OFFICER, UserRole.DEPARTMENT_OFFICER, UserRole.REGISTRAR)
  async reject(@GetUser() actor: { id: string; role: UserRole }, @Param('id') id: string, @Body('remarks') remarks: string) {
    return this.clearance.act(actor, id, 'REJECT', remarks);
  }
}
