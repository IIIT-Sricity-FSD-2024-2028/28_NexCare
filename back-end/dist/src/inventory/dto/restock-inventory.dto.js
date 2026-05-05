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
exports.RestockInventoryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RestockInventoryDto {
}
exports.RestockInventoryDto = RestockInventoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 200, description: 'Quantity to add' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsNotEmpty)({ message: 'Quantity is required' }),
    __metadata("design:type", Number)
], RestockInventoryDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'PharmaCorp', description: 'Supplier name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RestockInventoryDto.prototype, "supplier", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'BATCH-2026-03', description: 'Batch number' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RestockInventoryDto.prototype, "batchNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2028-03-01T00:00:00Z', description: 'Expiry date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RestockInventoryDto.prototype, "expiryDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'U002', description: 'Staff ID who restocked' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Restocked by is required' }),
    __metadata("design:type", String)
], RestockInventoryDto.prototype, "restockedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Received in good condition', description: 'Additional notes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RestockInventoryDto.prototype, "notes", void 0);
//# sourceMappingURL=restock-inventory.dto.js.map