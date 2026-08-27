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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const billing_service_1 = require("./billing.service");
const create_bill_dto_1 = require("./dto/create-bill.dto");
const update_bill_dto_1 = require("./dto/update-bill.dto");
const process_payment_dto_1 = require("./dto/process-payment.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
let BillingController = class BillingController {
    constructor(billingService) {
        this.billingService = billingService;
    }
    isPatient(req) {
        return req?.user?.role === api_response_interface_1.UserRole.PATIENT;
    }
    async assertOwnsBill(req, id) {
        if (!this.isPatient(req))
            return;
        const res = await this.billingService.findById(id);
        if (res?.success && res.data && res.data.patientId !== req.user.patientId) {
            throw new common_1.ForbiddenException('You can only access your own bills.');
        }
    }
    async findAll(req, patientId, status) {
        if (this.isPatient(req)) {
            patientId = req.user.patientId;
        }
        return this.billingService.findAll(patientId, status);
    }
    async create(createBillDto) {
        return this.billingService.create(createBillDto);
    }
    async getStats() {
        return this.billingService.getStats();
    }
    async findByPatient(req, patientId) {
        if (this.isPatient(req) && patientId !== req.user.patientId) {
            throw new common_1.ForbiddenException('You can only view your own bills.');
        }
        return this.billingService.findByPatient(patientId);
    }
    async getOverdueBills() {
        return this.billingService.getOverdueBills();
    }
    async getRevenueByDateRange(startDate, endDate) {
        return this.billingService.getRevenueByDateRange(startDate, endDate);
    }
    async findById(req, id) {
        await this.assertOwnsBill(req, id);
        return this.billingService.findById(id);
    }
    async update(id, updateBillDto) {
        return this.billingService.update(id, updateBillDto);
    }
    async patchUpdate(id, updateBillDto) {
        return this.billingService.update(id, updateBillDto);
    }
    async delete(id) {
        return this.billingService.delete(id);
    }
    async processPayment(req, id, processPaymentDto) {
        await this.assertOwnsBill(req, id);
        return this.billingService.processPayment(id, {
            amount: processPaymentDto.amount,
            method: processPaymentDto.method
        });
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.PATIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Get all bills (patients: only their own)' }),
    (0, swagger_1.ApiQuery)({ name: 'patientId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: api_response_interface_1.BillStatus }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of bills' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('patientId')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new bill' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bill creation result (check success field)' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_bill_dto_1.CreateBillDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get billing statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Billing statistics retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('patient/:patientId'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.PATIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Get bills by patient ID (patients: own only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of patient bills' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "findByPatient", null);
__decorate([
    (0, common_1.Get)('overdue'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all overdue bills' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of overdue bills' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getOverdueBills", null);
__decorate([
    (0, common_1.Get)('revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Get revenue by date range' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Revenue statistics retrieved' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getRevenueByDateRange", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.PATIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Get bill by ID (patients: own only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bill details retrieved' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update bill details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bill updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_bill_dto_1.UpdateBillDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Partially update bill details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bill updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_bill_dto_1.UpdateBillDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "patchUpdate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a bill' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bill deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "delete", null);
__decorate([
    (0, common_1.Patch)(':id/pay'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.PATIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Process payment for a bill (patients: own only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment processed successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, process_payment_dto_1.ProcessPaymentDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "processPayment", null);
exports.BillingController = BillingController = __decorate([
    (0, swagger_1.ApiTags)('Billing'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF),
    (0, common_1.Controller)('billing'),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map