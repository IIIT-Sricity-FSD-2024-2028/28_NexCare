/**
 * Update Bill DTO - Placeholder for validation decorators
 * Teammates will add class-validator decorators here
 */
export class UpdateBillDto {
  visitDate?: string;
  dueDate?: string;
  status?: string;
  items?: Array<{
    description: string;
    department: string;
    amount: number;
  }>;
}
