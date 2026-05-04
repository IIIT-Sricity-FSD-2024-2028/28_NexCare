/**
 * Create Bill DTO - Simple data transfer object
 * Transfers bill creation data between client and server
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
