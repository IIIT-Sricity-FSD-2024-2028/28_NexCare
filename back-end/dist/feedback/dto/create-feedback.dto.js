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
exports.CreateFeedbackDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateFeedbackDto {
}
exports.CreateFeedbackDto = CreateFeedbackDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'P001', description: 'Patient ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Patient ID is required' }),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Patient', description: 'Type of feedback provider' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Type is required' }),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'service', description: 'Category of feedback' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Category is required' }),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Great doctors', description: 'Subject of feedback' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Subject is required' }),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Dr. Smith was incredibly thorough.', description: 'Detailed summary' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Summary is required' }),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5, description: 'Rating (1-5)' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    (0, class_validator_1.IsNotEmpty)({ message: 'Rating is required' }),
    __metadata("design:type", Number)
], CreateFeedbackDto.prototype, "rating", void 0);
//# sourceMappingURL=create-feedback.dto.js.map