/**
 * Create System Activity DTO - Simple data transfer object
 * Transfers system activity logging data between client and server
 */
export class CreateSystemActivityDto {
  userId: string;
  action: string;
  details: string;
  module: string;
  severity: string;
}
