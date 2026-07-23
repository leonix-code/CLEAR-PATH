import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  // Security middleware
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const helmetFn = typeof helmet === 'function' ? helmet : require('helmet');
  const compressionFn = typeof compression === 'function' ? compression : require('compression');
  const cookieParserFn = typeof cookieParser === 'function' ? cookieParser : require('cookie-parser');
  app.use(helmetFn());
  app.use(compressionFn());
  app.use(cookieParserFn());

  // CORS
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  // Global prefix
  app.setGlobalPrefix(configService.get<string>('API_PREFIX', 'api/v1'), {
    exclude: ['health', 'swagger'],
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ClearPath API')
    .setDescription('Digital Student Clearance and Exam Eligibility Verification System')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Students', 'Student management')
    .addTag('Departments', 'Department management')
    .addTag('Courses', 'Course management')
    .addTag('Clearance', 'Clearance request management')
    .addTag('Officers', 'Officer dashboard operations')
    .addTag('Invigilator', 'Invigilator operations')
    .addTag('Notifications', 'Notification management')
    .addTag('Certificates', 'Certificate generation and management')
    .addTag('QR', 'QR code operations')
    .addTag('Reports', 'Report generation')
    .addTag('Analytics', 'Analytics and statistics')
    .addTag('Settings', 'System settings')
    .addTag('Audit Logs', 'Audit trail logs')
    .addTag('Semesters', 'Semester management')
    .addTag('Academic Years', 'Academic year management')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'ClearPath API Documentation',
  });

  const port = configService.get<number>('PORT', 4000);
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`Environment: ${configService.get<string>('NODE_ENV')}`);
}

bootstrap();
