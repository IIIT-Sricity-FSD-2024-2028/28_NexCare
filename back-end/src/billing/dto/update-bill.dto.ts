import { BillStatus } from '../../common/interfaces/api-response.interface';

/**
 * Update Bill DTO - Simple data transfer object
 * Transfers bill update data between client and server
 */
export class UpdateBillDto {
  visitDate?: string;
  dueDate?: string;
  status?: BillStatus;
  items?: Array<{
    description: string;
    department: string;
    amount: number;
  }>;
}
