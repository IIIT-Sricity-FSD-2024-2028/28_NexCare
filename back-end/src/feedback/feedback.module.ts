import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { SystemModule } from '../system/system.module';

/**
 * Feedback Module
 * Manages patient and staff feedback and complaints in the NexCare system
 * Provides CRUD operations and feedback resolution functionality
 */
@Module({
  imports: [SystemModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
