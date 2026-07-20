import { Module } from '@nestjs/common';
import { ClearanceController } from './controllers/clearance.controller';
import { ClearanceService } from './services/clearance.service';

@Module({
  controllers: [ClearanceController],
  providers: [ClearanceService],
  exports: [ClearanceService],
})
export class ClearanceModule {}
