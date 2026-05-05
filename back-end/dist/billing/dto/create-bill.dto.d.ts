export declare class CreateBillDto {
    patientId: string;
    visitDate: string;
    dueDate: string;
    items: Array<{
        description: string;
        department: string;
        amount: number;
    }>;
}
