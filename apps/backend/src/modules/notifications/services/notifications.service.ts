import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationType, NotificationPriority } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async create(data: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    priority?: NotificationPriority;
    sentById?: string;
    referenceType?: string;
    referenceId?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || NotificationType.IN_APP,
        priority: data.priority || NotificationPriority.NORMAL,
        sentById: data.sentById,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
      },
    });

    return notification;
  }

  async findAll(query: { page?: number; limit?: number; userId?: string; isRead?: boolean }) {
    const { page = 1, limit = 10, userId, isRead } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (userId) where.userId = userId;
    if (isRead !== undefined) where.isRead = isRead;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data: notifications, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async sendEmailNotification(to: string, subject: string, html: string) {
    // In production, integrate with nodemailer
    this.logger.log(`Email notification sent to ${to}: ${subject}`);
  }

  async sendSMSNotification(phone: string, message: string) {
    // In production, integrate with Twilio
    this.logger.log(`SMS notification sent to ${phone}: ${message}`);
  }

  async sendPushNotification(userId: string, title: string, body: string) {
    // In production, integrate with Firebase Cloud Messaging
    this.logger.log(`Push notification sent to user ${userId}: ${title}`);
  }
}
