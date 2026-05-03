/**
 * Create Bill DTO - Placeholder for validation decorators
 * Teammates will add class-validator decorators here
 */
export class CreateBillDto {
  patientId: string;
  visitDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    department: string;
    amount: number;
  }>;
}
