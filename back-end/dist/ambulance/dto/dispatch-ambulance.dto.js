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
exports.DispatchAmbulanceDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class DispatchAmbulanceDto {
}
exports.DispatchAmbulanceDto = DispatchAmbulanceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'U003', description: 'ID of staff assigned' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Assigned staff is required' }),
    __metadata("design:type", String)
], DispatchAmbulanceDto.prototype, "assignedTo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'AMB-101', description: 'Vehicle number' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DispatchAmbulanceDto.prototype, "vehicleNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+1 (555) 999-8888', description: 'Driver contact number' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DispatchAmbulanceDto.prototype, "driverContact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '10:30 AM', description: 'Estimated arrival time' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DispatchAmbulanceDto.prototype, "estimatedArrival", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'U002', description: 'Staff ID who dispatched' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Dispatched by is required' }),
    __metadata("design:type", String)
], DispatchAmbulanceDto.prototype, "dispatchedBy", void 0);
//# sourceMappingURL=dispatch-ambulance.dto.js.map