import { CreateBillRequest, UpdateBillRequest, PaymentRequest } from './interfaces/bill.interface';
import { BillStatus } from '../common/interfaces/api-response.interface';
import { SystemService } from '../system/system.service';
export declare class BillingService {
    private readonly systemService;
    constructor(systemService: SystemService);
    private readonly billsFilePath;
    private loadBills;
    private saveBills;
    private getInitialMockData;
    findAll(patientId?: string, status?: BillStatus): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(billData: CreateBillRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateData: UpdateBillRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    processPayment(id: string, paymentData: PaymentRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByPatient(patientId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getOverdueBills(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    private calculateGST;
    getRevenueByDateRange(startDate: string, endDate: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
