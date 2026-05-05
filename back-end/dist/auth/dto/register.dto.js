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
exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RegisterDto {
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe', description: 'Full name of the patient' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Full name is required' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john@example.com', description: 'Email address' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Please provide a valid email address' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password123', description: 'User password' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required' }),
    (0, class_validator_1.MinLength)(6, { message: 'Password must be at least 6 characters long' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+1 (555) 123-4567', description: 'Contact phone number' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Phone number is required' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'O+', description: 'Blood group' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "bloodGroup", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 35, description: 'Age of the patient' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0, { message: 'Age cannot be negative' }),
    __metadata("design:type", Number)
], RegisterDto.prototype, "age", void 0);
//# sourceMappingURL=register.dto.js.map