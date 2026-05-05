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
exports.CreateAmbulanceRequestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateAmbulanceRequestDto {
}
exports.CreateAmbulanceRequestDto = CreateAmbulanceRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'P001', description: 'ID of the patient requesting' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Patient ID is required' }),
    __metadata("design:type", String)
], CreateAmbulanceRequestDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'John Doe', description: 'Name of the patient requesting' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAmbulanceRequestDto.prototype, "patientName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123 Main Street', description: 'Pickup location address' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Pickup location is required' }),
    __metadata("design:type", String)
], CreateAmbulanceRequestDto.prototype, "pickupLocation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+1 (555) 123-4567', description: 'Contact phone number' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Contact is required' }),
    __metadata("design:type", String)
], CreateAmbulanceRequestDto.prototype, "contact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Patient has chest pain', description: 'Additional notes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAmbulanceRequestDto.prototype, "notes", void 0);
//# sourceMappingURL=create-request.dto.js.map