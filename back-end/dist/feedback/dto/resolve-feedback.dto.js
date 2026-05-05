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
exports.ResolveFeedbackDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class ResolveFeedbackDto {
}
exports.ResolveFeedbackDto = ResolveFeedbackDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Issue has been discussed with staff', description: 'Resolution provided' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Resolution is required' }),
    __metadata("design:type", String)
], ResolveFeedbackDto.prototype, "resolution", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'U002', description: 'Staff who resolved the feedback' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveFeedbackDto.prototype, "resolvedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Yes', description: 'Is follow-up required?' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveFeedbackDto.prototype, "followUpRequired", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Will check back in 1 week', description: 'Additional notes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveFeedbackDto.prototype, "notes", void 0);
//# sourceMappingURL=resolve-feedback.dto.js.map