import { FeedbackStatus } from '../../common/interfaces/api-response.interface';

/**
 * Feedback Entity Interface
 * Represents feedback in the NexCare system
 */
export interface Feedback {
  id: string;
  patientId: string;
  sender: string;
  type: string;
  category: string;
  subject: string;
  summary: string;
  rating: number;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Create Feedback Request Interface
 */
export interface CreateFeedbackRequest {
  patientId: string;
  type: string;
  category: string;
  subject: string;
  summary: string;
  rating: number;
}

/**
 * Update Feedback Request Interface
 */
export interface UpdateFeedbackRequest {
  category?: string;
  subject?: string;
  summary?: string;
  rating?: number;
  status?: FeedbackStatus;
}

/**
 * Feedback Statistics Interface
 */
export interface FeedbackStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  averageRating: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  byRating: Record<number, number>;
}
