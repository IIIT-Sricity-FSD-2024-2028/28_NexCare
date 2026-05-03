import { BillingService } from './billing.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    findAll(patientId?: string, status?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(createBillDto: CreateBillDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByPatient(patientId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getOverdueBills(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getRevenueByDateRange(startDate: string, endDate: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateBillDto: UpdateBillDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    patchUpdate(id: string, updateBillDto: UpdateBillDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    processPayment(id: string, amount: number, method: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
