import { BillStatus } from '../../common/interfaces/api-response.interface';

/**
 * Bill Item Interface
 */
export interface BillItem {
  description: string;
  department: string;
  amount: number;
  type?: string;
  referenceId?: string;
  date?: string;
}

/**
 * Pending Bill Charge Interface for adding charges to active patient bill
 */
export interface PendingBillCharge {
  type: string;
  description: string;
  amount: number;
  referenceId: string;
  department?: string;
  date?: string;
}

/**
 * Payment Interface
 */
export interface Payment {
  id: string;
  amount: number;
  method: string;
  createdAt: string;
}

/**
 * Bill Entity Interface
 * Represents a bill in the NexCare system
 */
export interface Bill {
  id: string;
  patientId: string;
  visitDate: string;
  dueDate: string;
  status: BillStatus;
  currency: string;
  subtotal: number;
  cgstRate: number;
  sgstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  total: number;
  items: BillItem[];
  payments: Payment[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Create Bill Request Interface
 */
export interface CreateBillRequest {
  patientId: string;
  visitDate: string;
  dueDate: string;
  items: BillItem[];
}

/**
 * Update Bill Request Interface
 */
export interface UpdateBillRequest {
  visitDate?: string;
  dueDate?: string;
  status?: BillStatus;
  items?: BillItem[];
}

/**
 * Payment Request Interface
 */
export interface PaymentRequest {
  amount: number;
  method: string;
}

/**
 * Bill Statistics Interface
 */
export interface BillStats {
  total: number;
  pending: number;
  paid: number;
  overdue: number;
  totalRevenue: number;
  pendingRevenue: number;
  averageBillAmount: number;
  byDepartment: Record<string, number>;
}
