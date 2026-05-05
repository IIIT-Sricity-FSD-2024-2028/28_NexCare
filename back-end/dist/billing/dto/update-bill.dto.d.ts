import { BillStatus } from '../../common/interfaces/api-response.interface';
export declare class UpdateBillDto {
    visitDate?: string;
    dueDate?: string;
    status?: BillStatus;
    items?: Array<{
        description: string;
        department: string;
        amount: number;
    }>;
}
