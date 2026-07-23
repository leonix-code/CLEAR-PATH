import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

interface NotificationPayload {
  userId: string; title: string; message: string;
  type?: NotificationType; priority?: NotificationPriority;
  sentById?: string; referenceType?: string; referenceId?: string;
}

@Injectable()
export class NotificationChannelService {
  private readonly logger = new Logger(NotificationChannelService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async send(payload: NotificationPayload): Promise<void> {
    await this.createInAppNotification(payload);
    const user = await this.prisma.user.findUnique({ where: { id: payload.userId }, select: { email: true, phone: true } });
    if (!user) return;
    if (payload.type === NotificationType.EMAIL && user.email) await this.sendEmail(user.email, payload.title, payload.message);
    if (payload.type === NotificationType.SMS && user.phone) await this.sendSMS(user.phone, payload.message);
    if (payload.type === NotificationType.PUSH) await this.sendPush(payload.userId, payload.title, payload.message);
  }

  async sendTemplate(templateKey: string, userId: string, variables: Record<string, string>, options?: { channels?: NotificationType[]; referenceType?: string; referenceId?: string }) {
    const templates: Record<string, { title: string; body: string }> = {
      clearance_submitted: { title: 'Clearance Submitted', body: 'Your clearance request for ' + (variables.semester || '') + ' has been submitted.' },
      stage_approved: { title: 'Stage Approved', body: variables.stage + ' has approved your clearance.' },
      stage_rejected: { title: 'Stage Rejected', body: variables.stage + ' has rejected your clearance. Reason: ' + (variables.reason || '') },
      fully_cleared: { title: 'Fully Cleared!', body: 'Congratulations! You are fully cleared for ' + (variables.semester || '') + '.' },
      certificate_issued: { title: 'Certificate Issued', body: 'Your clearance certificate has been issued. Download from the portal.' },
    };

    const template = templates[templateKey];
    if (!template) { this.logger.warn('Template not found: ' + templateKey); return; }

    const channels = options?.channels || [NotificationType.IN_APP, NotificationType.EMAIL];
    for (const channel of channels) {
      await this.send({
        userId, title: template.title, message: template.body,
        type: channel, referenceType: options?.referenceType, referenceId: options?.referenceId,
      });
    }
  }

  private async createInAppNotification(payload: NotificationPayload) {
    try {
      await this.prisma.notification.create({
        data: {
          userId: payload.userId, title: payload.title, message: payload.message,
          type: payload.type || NotificationType.IN_APP,
          priority: payload.priority || NotificationPriority.NORMAL,
          sentById: payload.sentById, referenceType: payload.referenceType, referenceId: payload.referenceId,
        },
      });
    } catch (e) { this.logger.error('Failed to create notification: ' + e); }
  }

  private async sendEmail(to: string, subject: string, message: string) {
    this.logger.log('Email to ' + to + ': ' + subject);
    // Integrate with nodemailer/SendGrid in production
  }

  private async sendSMS(phone: string, message: string) {
    this.logger.log('SMS to ' + phone + ': ' + message);
    // Integrate with Twilio in production
  }

  private async sendPush(userId: string, title: string, body: string) {
    this.logger.log('Push to ' + userId + ': ' + title);
    // Integrate with Firebase in production
  }
}
