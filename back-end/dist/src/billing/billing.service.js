"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
const system_service_1 = require("../system/system.service");
let BillingService = class BillingService {
    constructor(systemService) {
        this.systemService = systemService;
        this.billsFilePath = path.join(process.cwd(), 'data', 'billing.json');
    }
    round2(n) {
        return Math.round((n + Number.EPSILON) * 100) / 100;
    }
    loadBills() {
        try {
            if (!fs.existsSync(this.billsFilePath)) {
                const initial = this.getInitialMockData();
                this.saveBills(initial);
                return initial;
            }
            const raw = fs.readFileSync(this.billsFilePath, 'utf-8');
            return JSON.parse(raw);
        }
        catch {
            return this.getInitialMockData();
        }
    }
    saveBills(bills) {
        try {
            fs.mkdirSync(path.dirname(this.billsFilePath), { recursive: true });
            fs.writeFileSync(this.billsFilePath, JSON.stringify(bills, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('Failed to persist bills:', err);
        }
    }
    getInitialMockData() {
        return [
            {
                id: 'BILL-001',
                patientId: 'P001',
                visitDate: '1 March, 2026',
                dueDate: '15 March, 2026',
                status: api_response_interface_1.BillStatus.PAID,
                currency: '₹',
                subtotal: 1000,
                cgstRate: 0.09,
                sgstRate: 0.09,
                cgstAmount: 90,
                sgstAmount: 90,
                total: 1180,
                items: [
                    { description: 'General Consultation', department: 'General Medicine', amount: 1000 }
                ],
                payments: [
                    { id: 'PAY-001', amount: 1180, method: 'CARD', createdAt: '2026-03-10T10:00:00Z' }
                ],
                createdAt: '2026-03-01T00:00:00Z'
            },
            {
                id: 'BILL-002',
                patientId: 'P002',
                visitDate: '2 April, 2026',
                dueDate: '16 April, 2026',
                status: api_response_interface_1.BillStatus.PENDING,
                currency: '₹',
                subtotal: 5500,
                cgstRate: 0.09,
                sgstRate: 0.09,
                cgstAmount: 495,
                sgstAmount: 495,
                total: 6490,
                items: [
                    { description: 'Emergency Room Admittance', department: 'ER', amount: 2500 },
                    { description: 'MRI Scan', department: 'Radiology', amount: 3000 }
                ],
                payments: [],
                createdAt: '2026-04-02T00:00:00Z'
            }
        ];
    }
    async findAll(patientId, status) {
        try {
            let filteredBills = [...this.loadBills()];
            if (patientId) {
                filteredBills = filteredBills.filter(bill => bill.patientId === patientId);
            }
            if (status) {
                filteredBills = filteredBills.filter(bill => bill.status === status);
            }
            return response_util_1.ResponseUtil.success('Bills retrieved successfully', filteredBills);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve bills');
        }
    }
    async findById(id) {
        try {
            const bills = this.loadBills();
            const bill = bills.find(b => b.id === id);
            if (!bill) {
                return response_util_1.ResponseUtil.notFound('Bill', id);
            }
            return response_util_1.ResponseUtil.success('Bill retrieved successfully', bill);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve bill');
        }
    }
    async create(billData) {
        try {
            const bills = this.loadBills();
            const newBillId = id_generator_util_1.IdGenerator.generateBillId();
            const subtotal = this.round2(billData.items.reduce((sum, item) => sum + item.amount, 0));
            const cgstRate = 0.09;
            const sgstRate = 0.09;
            const cgstAmount = this.round2(subtotal * cgstRate);
            const sgstAmount = this.round2(subtotal * sgstRate);
            const total = this.round2(subtotal + cgstAmount + sgstAmount);
            const newBill = {
                id: newBillId,
                patientId: billData.patientId,
                visitDate: billData.visitDate,
                dueDate: billData.dueDate,
                status: api_response_interface_1.BillStatus.PENDING,
                currency: '₹',
                subtotal,
                cgstRate,
                sgstRate,
                cgstAmount,
                sgstAmount,
                total,
                items: billData.items,
                payments: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            bills.push(newBill);
            this.saveBills(bills);
            this.systemService.createActivity({
                userId: billData.patientId,
                action: 'Create',
                details: `New bill ${newBillId} generated for ₹${total}`,
                module: 'Billing',
                severity: 'INFO'
            });
            return response_util_1.ResponseUtil.created('Bill created successfully', newBill);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to create bill');
        }
    }
    async update(id, updateData) {
        try {
            const bills = this.loadBills();
            const billIndex = bills.findIndex(b => b.id === id);
            if (billIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Bill', id);
            }
            const bill = bills[billIndex];
            if (bill.status === api_response_interface_1.BillStatus.PAID) {
                return response_util_1.ResponseUtil.error('Cannot modify paid bills');
            }
            let updatedBill = { ...bill, ...updateData, updatedAt: new Date().toISOString() };
            if (updateData.items) {
                const subtotal = this.round2(updateData.items.reduce((sum, item) => sum + item.amount, 0));
                const cgstAmount = this.round2(subtotal * updatedBill.cgstRate);
                const sgstAmount = this.round2(subtotal * updatedBill.sgstRate);
                const total = this.round2(subtotal + cgstAmount + sgstAmount);
                updatedBill = {
                    ...updatedBill,
                    subtotal,
                    cgstAmount,
                    sgstAmount,
                    total
                };
            }
            bills[billIndex] = updatedBill;
            this.saveBills(bills);
            this.systemService.createActivity({
                userId: 'Admin',
                action: 'Update',
                details: `Bill ${id} details updated`,
                module: 'Billing',
                severity: 'INFO'
            });
            return response_util_1.ResponseUtil.updated('Bill updated successfully', updatedBill);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update bill');
        }
    }
    async delete(id) {
        try {
            const bills = this.loadBills();
            const billIndex = bills.findIndex(b => b.id === id);
            if (billIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Bill', id);
            }
            const bill = bills[billIndex];
            if (bill.status === api_response_interface_1.BillStatus.PAID) {
                return response_util_1.ResponseUtil.error('Cannot delete paid bills');
            }
            bills.splice(billIndex, 1);
            this.saveBills(bills);
            return response_util_1.ResponseUtil.deleted('Bill');
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to delete bill');
        }
    }
    async processPayment(id, paymentData) {
        try {
            const bills = this.loadBills();
            const billIndex = bills.findIndex(b => b.id === id);
            if (billIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Bill', id);
            }
            const bill = bills[billIndex];
            if (bill.status === api_response_interface_1.BillStatus.PAID) {
                return response_util_1.ResponseUtil.error('Bill is already paid');
            }
            const totalPaid = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
            const remainingAmount = bill.total - totalPaid;
            if (paymentData.amount > remainingAmount) {
                return response_util_1.ResponseUtil.error(`Payment amount exceeds remaining balance of ₹${remainingAmount}`);
            }
            const newPayment = {
                id: id_generator_util_1.IdGenerator.generatePaymentId(),
                amount: paymentData.amount,
                method: paymentData.method,
                createdAt: new Date().toISOString()
            };
            bill.payments.push(newPayment);
            const newTotalPaid = totalPaid + paymentData.amount;
            if (newTotalPaid >= bill.total) {
                bill.status = api_response_interface_1.BillStatus.PAID;
            }
            bill.updatedAt = new Date().toISOString();
            bills[billIndex] = bill;
            this.saveBills(bills);
            this.systemService.createActivity({
                userId: bill.patientId,
                action: 'Payment',
                details: `Payment of ₹${paymentData.amount} processed for bill ${id}`,
                module: 'Billing',
                severity: 'SUCCESS'
            });
            return response_util_1.ResponseUtil.updated('Payment processed successfully', bill);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to process payment');
        }
    }
    async getStats() {
        try {
            const bills = this.loadBills();
            const totalBills = bills.length;
            const pendingBills = bills.filter(b => b.status === api_response_interface_1.BillStatus.PENDING).length;
            const paidBills = bills.filter(b => b.status === api_response_interface_1.BillStatus.PAID).length;
            const overdueBills = bills.filter(b => b.status === api_response_interface_1.BillStatus.OVERDUE).length;
            const totalRevenue = bills
                .filter(b => b.status === api_response_interface_1.BillStatus.PAID)
                .reduce((sum, bill) => sum + bill.total, 0);
            const pendingRevenue = bills
                .filter(b => b.status === api_response_interface_1.BillStatus.PENDING)
                .reduce((sum, bill) => sum + bill.total, 0);
            const averageBillAmount = totalBills > 0 ? Math.round(bills.reduce((sum, bill) => sum + bill.total, 0) / totalBills) : 0;
            const byDepartment = {};
            bills.forEach(bill => {
                bill.items.forEach(item => {
                    byDepartment[item.department] = (byDepartment[item.department] || 0) + item.amount;
                });
            });
            const stats = {
                total: totalBills,
                pending: pendingBills,
                paid: paidBills,
                overdue: overdueBills,
                totalRevenue,
                pendingRevenue,
                averageBillAmount,
                byDepartment
            };
            return response_util_1.ResponseUtil.success('Bill statistics retrieved successfully', stats);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve bill statistics');
        }
    }
    async findByPatient(patientId) {
        try {
            const bills = this.loadBills().filter(b => b.patientId === patientId);
            return response_util_1.ResponseUtil.success(`Bills for patient ${patientId} retrieved successfully`, bills);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve patient bills');
        }
    }
    async getOverdueBills() {
        try {
            const today = new Date();
            const overdueBills = this.loadBills().filter(bill => {
                if (bill.status === api_response_interface_1.BillStatus.PAID)
                    return false;
                const dueDate = new Date(bill.dueDate);
                return dueDate < today;
            });
            return response_util_1.ResponseUtil.success('Overdue bills retrieved successfully', overdueBills);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve overdue bills');
        }
    }
    calculateGST(amount) {
        const cgstRate = 0.09;
        const sgstRate = 0.09;
        const cgstAmount = this.round2(amount * cgstRate);
        const sgstAmount = this.round2(amount * sgstRate);
        const total = this.round2(amount + cgstAmount + sgstAmount);
        return {
            subtotal: amount,
            cgstRate,
            sgstRate,
            cgstAmount,
            sgstAmount,
            total
        };
    }
    async getRevenueByDateRange(startDate, endDate) {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const billsInRange = this.loadBills().filter(bill => {
                const billDate = new Date(bill.visitDate);
                return billDate >= start && billDate <= end && bill.status === api_response_interface_1.BillStatus.PAID;
            });
            const revenue = billsInRange.reduce((sum, bill) => sum + bill.total, 0);
            return response_util_1.ResponseUtil.success(`Revenue from ${startDate} to ${endDate} retrieved successfully`, {
                revenue,
                billCount: billsInRange.length,
                dateRange: { startDate, endDate }
            });
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve revenue data');
        }
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [system_service_1.SystemService])
], BillingService);
//# sourceMappingURL=billing.service.js.map