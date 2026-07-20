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
import { StudentsService } from '../services/students.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { GetUser } from '../../../common/decorators/get-user.decorator';

@ApiTags('Students')
@Controller({ path: 'students', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(UserRole.ADMINISTRATOR, UserRole.DEPARTMENT_OFFICER, UserRole.ICT_SUPPORT)
  @ApiOperation({ summary: 'Get all students' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('departmentId') departmentId?: string,
    @Query('courseId') courseId?: string,
    @Query('level') level?: number,
    @Query('search') search?: string,
  ) {
    return this.studentsService.findAll({ page, limit, departmentId, courseId, level, search });
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my student profile' })
  async getMyProfile(@GetUser('id') userId: string) {
    return this.studentsService.findByUserId(userId);
  }

  @Get(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.DEPARTMENT_OFFICER, UserRole.ICT_SUPPORT)
  @ApiOperation({ summary: 'Get student by ID' })
  async findById(@Param('id') id: string) {
    return this.studentsService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ICT_SUPPORT)
  @ApiOperation({ summary: 'Create new student record' })
  async create(@Body() data: any) {
    return this.studentsService.create(data);
  }

  @Patch(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ICT_SUPPORT)
  @ApiOperation({ summary: 'Update student record' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.studentsService.update(id, data);
  }
}
