import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;
    const modelNames = ['user', 'student', 'department', 'course', 'clearanceRequest', 'clearanceApproval', 'notification', 'auditLog', 'refreshToken', 'passwordReset', 'emailVerification', 'deviceSession', 'magicLink', 'oAuthState', 'qrCode', 'certificate', 'semester', 'academicYear', 'systemSetting', 'backupLog', 'examEligibility', 'roleAssignment', 'permission', 'rolePermission', 'parentRelation', 'studentHistory'];
    return Promise.all(modelNames.map((name) => (this as any)[name]?.deleteMany()));
  }
}
