/**
 * Create Feedback DTO - Simple data transfer object
 * Transfers feedback submission data between client and server
 */
export class CreateFeedbackDto {
  patientId: string;
  type: string;
  category: string;
  subject: string;
  summary: string;
  rating: number;
}
