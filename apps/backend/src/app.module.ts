import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ClearanceModule } from './modules/clearance/clearance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OfficersModule } from './modules/officers/officers.module';
import { InvigilatorModule } from './modules/invigilator/invigilator.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { QRModule } from './modules/qr/qr.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { SemestersModule } from './modules/semesters/semesters.module';
import { AcademicYearsModule } from './modules/academic-years/academic-years.module';
import { AIModule } from './modules/ai/ai.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development.local', '.env.development', '.env.local', '.env'],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60),
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    DepartmentsModule,
    CoursesModule,
    ClearanceModule,
    NotificationsModule,
    OfficersModule,
    InvigilatorModule,
    ReportsModule,
    AnalyticsModule,
    SettingsModule,
    CertificatesModule,
    QRModule,
    AuditLogsModule,
    SemestersModule,
    AcademicYearsModule,
    AIModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
