import { FeedbackStatus } from '../../common/interfaces/api-response.interface';

/**
 * Update Feedback DTO - Simple data transfer object
 * Transfers feedback update data between client and server
 */
export class UpdateFeedbackDto {
  category?: string;
  subject?: string;
  summary?: string;
  rating?: number;
  status?: FeedbackStatus;
}
