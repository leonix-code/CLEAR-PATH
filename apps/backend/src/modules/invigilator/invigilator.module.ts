import { Module } from '@nestjs/common';
import { InvigilatorController } from './controllers/invigilator.controller';
import { InvigilatorService } from './services/invigilator.service';

@Module({
  controllers: [InvigilatorController],
  providers: [InvigilatorService],
  exports: [InvigilatorService],
})
export class InvigilatorModule {}
