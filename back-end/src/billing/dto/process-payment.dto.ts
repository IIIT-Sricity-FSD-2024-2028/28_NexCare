/**
 * Process Payment DTO - Simple data transfer object
 * Transfers payment processing data between client and server
 */
export class ProcessPaymentDto {
  method: string;
  amount: number;
  transactionId?: string;
  processedBy?: string;
}
