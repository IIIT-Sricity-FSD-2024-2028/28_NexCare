import { BillingService } from './billing.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    private isPatient;
    private assertOwnsBill;
    findAll(req: any, patientId?: string, status?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(createBillDto: CreateBillDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByPatient(req: any, patientId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getOverdueBills(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getRevenueByDateRange(startDate: string, endDate: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(req: any, id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateBillDto: UpdateBillDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    patchUpdate(id: string, updateBillDto: UpdateBillDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    processPayment(req: any, id: string, processPaymentDto: ProcessPaymentDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
