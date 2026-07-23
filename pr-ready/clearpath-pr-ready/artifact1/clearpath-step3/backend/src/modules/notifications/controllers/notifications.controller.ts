import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from '../services/notifications.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { NotificationQueryDto } from '../dto/notification-query.dto';
@ApiTags('Notifications')
@Controller({ path: 'notifications', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get() findAll(@GetUser('id') userId: string, @Query() query: NotificationQueryDto) { return this.notifications.findAll(userId, query); }
  @Get('unread-count') unread(@GetUser('id') userId: string) { return this.notifications.getUnreadCount(userId); }
  @Patch(':id/read') read(@GetUser('id') userId: string, @Param('id') id: string) { return this.notifications.markAsRead(id, userId); }
  @Patch('mark-all-read') readAll(@GetUser('id') userId: string) { return this.notifications.markAllAsRead(userId); }
}
