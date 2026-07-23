import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';               // FIX H3: default import (helmet v7 is a fn export)
import compression from 'compression';     // FIX H3: default import
import cookieParser from 'cookie-parser';  // FIX H3: default import
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const config = app.get(ConfigService);

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  const origins = config.get<string>('FRONTEND_URL', 'http://localhost:3000').split(',');
  app.enableCors({
    origin: origins,           // FIX M7: multi-origin support
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // FIX H4: single source of versioning. Controllers already use version:'1',
  // so drop the global 'api/v1' prefix and let URI versioning produce /v1/*,
  // OR keep a static prefix and remove enableVersioning(). Here we pick ONE:
  app.setGlobalPrefix('api', { exclude: ['health'] });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, forbidNonWhitelisted: true, transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  const swagger = new DocumentBuilder()
    .setTitle('ClearPath API')
    .setDescription('Digital Student Clearance and Exam Eligibility Verification System')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger), {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  logger.log(`ClearPath API on :${port} (docs at /api/docs)`);
}
bootstrap();
