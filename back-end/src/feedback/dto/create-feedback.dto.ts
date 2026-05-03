/**
 * Create Feedback DTO - Placeholder for validation decorators
 * Teammates will add class-validator decorators here
 */
export class CreateFeedbackDto {
  patientId: string;
  type: string;
  category: string;
  subject: string;
  summary: string;
  rating: number;
}
