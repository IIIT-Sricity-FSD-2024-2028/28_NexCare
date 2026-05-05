export declare class BillItemDto {
    description: string;
    department: string;
    amount: number;
}
export declare class CreateBillDto {
    patientId: string;
    visitDate: string;
    dueDate: string;
    items: BillItemDto[];
}
