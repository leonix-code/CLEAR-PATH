import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationPriority, NotificationType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/** In-app notification service. External delivery belongs behind an async queue adapter. */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: string; title: string; message: string; type?: NotificationType; priority?: NotificationPriority; sentById?: string; referenceType?: string; referenceId?: string }) {
    return this.prisma.notification.create({ data: { ...data, type: data.type ?? NotificationType.IN_APP, priority: data.priority ?? NotificationPriority.NORMAL } });
  }

  async findAll(userId: string, query: { page?: number; limit?: number; isRead?: boolean }) {
    const page = Math.max(1, query.page ?? 1); const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const where = { userId, ...(query.isRead === undefined ? {} : { isRead: query.isRead }) };
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.notification.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async markAsRead(id: string, userId: string) {
    const result = await this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true, readAt: new Date() } });
    if (!result.count) throw new NotFoundException('Notification not found');
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
    return { updated: result.count };
  }

  async getUnreadCount(userId: string) {
    return { count: await this.prisma.notification.count({ where: { userId, isRead: false } }) };
  }
}
