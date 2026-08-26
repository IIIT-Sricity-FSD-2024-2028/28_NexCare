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
exports.RegisterStaffDto = void 0;
const api_response_interface_1 = require("../../common/interfaces/api-response.interface");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const ALLOWED_STAFF_ROLES = [
    api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF,
    api_response_interface_1.UserRole.AMBULANCE,
];
class RegisterStaffDto {
}
exports.RegisterStaffDto = RegisterStaffDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Jane Smith', description: 'Full name of the staff member' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Full name is required' }),
    __metadata("design:type", String)
], RegisterStaffDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'jane@nexcare.com', description: 'Email address' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Please provide a valid email address' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required' }),
    __metadata("design:type", String)
], RegisterStaffDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password123', description: 'Account password' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required' }),
    (0, class_validator_1.MinLength)(6, { message: 'Password must be at least 6 characters long' }),
    __metadata("design:type", String)
], RegisterStaffDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '5551234567', description: 'Contact phone number' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Phone number is required' }),
    __metadata("design:type", String)
], RegisterStaffDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ALLOWED_STAFF_ROLES,
        example: api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF,
        description: 'Staff role to register as',
    }),
    (0, class_validator_1.IsIn)(ALLOWED_STAFF_ROLES, {
        message: 'Role must be one of: administrative_staff, ambulance',
    }),
    __metadata("design:type", String)
], RegisterStaffDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'H001', description: 'Hospital the staff member belongs to' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Hospital is required' }),
    __metadata("design:type", String)
], RegisterStaffDto.prototype, "hospitalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Front Desk', description: 'Department the staff member works in' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterStaffDto.prototype, "dept", void 0);
//# sourceMappingURL=register-staff.dto.js.map