import { BillStatus } from '../../common/interfaces/api-response.interface';
export interface BillItem {
    description: string;
    department: string;
    amount: number;
}
export interface Payment {
    id: string;
    amount: number;
    method: string;
    createdAt: string;
}
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
export interface CreateBillRequest {
    patientId: string;
    visitDate: string;
    dueDate: string;
    items: BillItem[];
}
export interface UpdateBillRequest {
    visitDate?: string;
    dueDate?: string;
    status?: BillStatus;
    items?: BillItem[];
}
export interface PaymentRequest {
    amount: number;
    method: string;
}
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
