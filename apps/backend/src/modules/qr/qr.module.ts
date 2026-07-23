import { Module } from '@nestjs/common';
import { QRController } from './controllers/qr.controller';
import { QRService } from './services/qr.service';

@Module({
  controllers: [QRController],
  providers: [QRService],
  exports: [QRService],
})
export class QRModule {}
