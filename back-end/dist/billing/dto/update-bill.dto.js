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
exports.UpdateBillDto = void 0;
const api_response_interface_1 = require("../../common/interfaces/api-response.interface");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const create_bill_dto_1 = require("./create-bill.dto");
class UpdateBillDto {
}
exports.UpdateBillDto = UpdateBillDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-03-01T00:00:00Z', description: 'Date of visit' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "visitDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-03-15T00:00:00Z', description: 'Due date for payment' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "dueDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: api_response_interface_1.BillStatus, example: api_response_interface_1.BillStatus.PENDING, description: 'Status of the bill' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(api_response_interface_1.BillStatus),
    __metadata("design:type", String)
], UpdateBillDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [create_bill_dto_1.BillItemDto], description: 'Items included in the bill' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => create_bill_dto_1.BillItemDto),
    __metadata("design:type", Array)
], UpdateBillDto.prototype, "items", void 0);
//# sourceMappingURL=update-bill.dto.js.map