export declare class UpdateBillDto {
    visitDate?: string;
    dueDate?: string;
    status?: string;
    items?: Array<{
        description: string;
        department: string;
        amount: number;
    }>;
}
