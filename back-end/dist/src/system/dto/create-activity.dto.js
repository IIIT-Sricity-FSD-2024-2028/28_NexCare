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
exports.CreateSystemActivityDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateSystemActivityDto {
}
exports.CreateSystemActivityDto = CreateSystemActivityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'U002', description: 'ID of the user performing the action' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'User ID is required' }),
    __metadata("design:type", String)
], CreateSystemActivityDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Login', description: 'Action performed' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Action is required' }),
    __metadata("design:type", String)
], CreateSystemActivityDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'User logged in successfully', description: 'Detailed description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Details are required' }),
    __metadata("design:type", String)
], CreateSystemActivityDto.prototype, "details", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Authentication', description: 'Module where action occurred' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Module is required' }),
    __metadata("design:type", String)
], CreateSystemActivityDto.prototype, "module", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'INFO', description: 'Severity level (INFO, WARNING, HIGH, CRITICAL)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Severity is required' }),
    __metadata("design:type", String)
], CreateSystemActivityDto.prototype, "severity", void 0);
//# sourceMappingURL=create-activity.dto.js.map