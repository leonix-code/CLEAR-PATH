import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from '../services/courses.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Courses')
@Controller({ path: 'courses', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('departmentId') departmentId?: string, @Query('search') search?: string) {
    return this.coursesService.findAll({ page, limit, departmentId, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  async findById(@Param('id') id: string) { return this.coursesService.findById(id); }

  @Post()
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Create course' })
  async create(@Body() data: any) { return this.coursesService.create(data); }

  @Patch(':id')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Update course' })
  async update(@Param('id') id: string, @Body() data: any) { return this.coursesService.update(id, data); }
}
