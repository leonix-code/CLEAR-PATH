import { Module } from '@nestjs/common';
import { ClearanceController } from './controllers/clearance.controller';
import { WorkflowController } from './controllers/workflow.controller';
import { ReportsController } from './controllers/reports.controller';
import { ClearanceService } from './services/clearance.service';
import { WorkflowEngineService } from './services/workflow-engine.service';
import { ReportsService } from './services/reports.service';
import { NotificationChannelService } from './services/notification-channel.service';

@Module({
  controllers: [ClearanceController, WorkflowController, ReportsController],
  providers: [ClearanceService, WorkflowEngineService, ReportsService, NotificationChannelService],
  exports: [ClearanceService, WorkflowEngineService, ReportsService, NotificationChannelService],
})
export class ClearanceModule {}
