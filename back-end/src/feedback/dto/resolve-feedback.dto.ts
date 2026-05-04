/**
 * Resolve Feedback DTO - Simple data transfer object
 * Transfers feedback resolution data between client and server
 */
export class ResolveFeedbackDto {
  resolution: string;
  resolvedBy?: string;
  followUpRequired?: string;
  notes?: string;
}
