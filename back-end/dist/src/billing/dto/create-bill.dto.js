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
exports.CreateBillDto = exports.BillItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class BillItemDto {
}
exports.BillItemDto = BillItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'General Consultation', description: 'Description of the item' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BillItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'General Medicine', description: 'Department responsible' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BillItemDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1000, description: 'Amount for the item' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], BillItemDto.prototype, "amount", void 0);
class CreateBillDto {
}
exports.CreateBillDto = CreateBillDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'P001', description: 'ID of the patient' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Patient ID is required' }),
    __metadata("design:type", String)
], CreateBillDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-03-01T00:00:00Z', description: 'Date of visit' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Visit date is required' }),
    __metadata("design:type", String)
], CreateBillDto.prototype, "visitDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-03-15T00:00:00Z', description: 'Due date for payment' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Due date is required' }),
    __metadata("design:type", String)
], CreateBillDto.prototype, "dueDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BillItemDto], description: 'Items included in the bill' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BillItemDto),
    __metadata("design:type", Array)
], CreateBillDto.prototype, "items", void 0);
//# sourceMappingURL=create-bill.dto.js.map