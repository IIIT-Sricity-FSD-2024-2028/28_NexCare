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
exports.AllocateBedDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class AllocateBedDto {
}
exports.AllocateBedDto = AllocateBedDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'P001', description: 'ID of the patient' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Patient ID is required' }),
    __metadata("design:type", String)
], AllocateBedDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Emergency', description: 'Type of admission' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AllocateBedDto.prototype, "admissionType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'U002', description: 'Staff who allocated the bed' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AllocateBedDto.prototype, "allocatedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Patient needs monitoring', description: 'Additional notes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AllocateBedDto.prototype, "notes", void 0);
//# sourceMappingURL=allocate-bed.dto.js.map