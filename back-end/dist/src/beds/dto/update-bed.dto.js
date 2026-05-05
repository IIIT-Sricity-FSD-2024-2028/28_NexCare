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
exports.UpdateBedDto = void 0;
const api_response_interface_1 = require("../../common/interfaces/api-response.interface");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateBedDto {
}
exports.UpdateBedDto = UpdateBedDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ICU', description: 'Ward the bed belongs to' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBedDto.prototype, "ward", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: api_response_interface_1.BedStatus, example: api_response_interface_1.BedStatus.OCCUPIED, description: 'Status of the bed' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(api_response_interface_1.BedStatus),
    __metadata("design:type", String)
], UpdateBedDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'John Doe', description: 'Patient name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBedDto.prototype, "patient", void 0);
//# sourceMappingURL=update-bed.dto.js.map