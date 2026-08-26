import { Module } from '@nestjs/common';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';
import { LeaveRequestGuard } from './guards/leave-request.guard';

/**
 * Leaves Module
 * Manages doctor leave requests and approvals in the NexCare system
 * Provides CRUD operations and leave management functionality
 */
@Module({
  controllers: [LeavesController],
  providers: [LeavesService, LeaveRequestGuard],
  exports: [LeavesService],
})
export class LeavesModule {}
