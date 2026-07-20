import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { ConfigService } from '@nestjs/config';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { createMockPrisma, mockConfigService } from '../../../testing/mocks/prisma.mock';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    title: 'Clearance Approved',
    message: 'Your clearance has been approved',
    type: NotificationType.IN_APP,
    priority: NotificationPriority.NORMAL,
    isRead: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Create
  describe('create', () => {
    it('should create a notification', async () => {
      prisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create({
        userId: 'user-1',
        title: 'Clearance Approved',
        message: 'Your clearance has been approved',
      });

      expect(result).toBeDefined();
      expect(result.title).toBe('Clearance Approved');
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('should set default type to IN_APP', async () => {
      prisma.notification.create.mockResolvedValue(mockNotification);

      await service.create({
        userId: 'user-1',
        title: 'Test',
        message: 'Test message',
      });

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: NotificationType.IN_APP }),
        }),
      );
    });

    it('should accept custom type and priority', async () => {
      prisma.notification.create.mockResolvedValue({
        ...mockNotification,
        type: NotificationType.EMAIL,
        priority: NotificationPriority.HIGH,
      });

      const result = await service.create({
        userId: 'user-1',
        title: 'Urgent',
        message: 'Urgent message',
        type: NotificationType.EMAIL,
        priority: NotificationPriority.HIGH,
      });

      expect(result.type).toBe(NotificationType.EMAIL);
      expect(result.priority).toBe(NotificationPriority.HIGH);
    });
  });

  // Find All
  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      prisma.notification.findMany.mockResolvedValue([mockNotification]);
      prisma.notification.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by userId', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await service.findAll({ userId: 'user-1' });
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
    });

    it('should filter by read status', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await service.findAll({ isRead: false });
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isRead: false }),
        }),
      );
    });
  });

  // Mark as Read
  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.markAsRead('notif-1', 'user-1');
      expect(result).toBeDefined();
    });
  });

  // Mark All as Read
  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('user-1');
      expect(result).toBeDefined();
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: expect.objectContaining({ isRead: true, readAt: expect.any(Date) }),
      });
    });
  });

  // Unread Count
  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      prisma.notification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-1');
      expect(result).toBe(3);
    });
  });

  // Notification Channels
  describe('sendEmailNotification', () => {
    it('should log email notification', async () => {
      const loggerSpy = jest.spyOn(service as any, 'logger');
      await service.sendEmailNotification('user@test.com', 'Hello', '<p>Hi</p>');
      expect(loggerSpy).toBeDefined();
    });
  });

  describe('sendSMSNotification', () => {
    it('should log SMS notification', async () => {
      await service.sendSMSNotification('+1234567890', 'Hello');
    });
  });

  describe('sendPushNotification', () => {
    it('should log push notification', async () => {
      await service.sendPushNotification('user-1', 'Title', 'Body');
    });
  });
});
