"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationMiddlewareExample = exports.FrontendValidationExample = exports.CustomValidationExample = exports.ValidationServiceExample = exports.ValidationControllerExample = void 0;
const dto_validator_util_1 = require("./dto-validator.util");
const frontend_validation_service_1 = require("./frontend-validation.service");
class ValidationControllerExample {
    async createAmbulanceRequest(dto) {
        const validation = dto_validator_util_1.DtoValidatorUtil.validateAmbulanceRequest(dto);
        if (!validation.isValid) {
            return {
                success: false,
                message: 'Validation failed',
                errors: validation.errors,
                fieldErrors: validation.fieldErrors
            };
        }
        return {
            success: true,
            message: 'Ambulance request created successfully',
            data: dto
        };
    }
    async registerUser(dto) {
        const validation = dto_validator_util_1.DtoValidatorUtil.validateUserRegistration(dto);
        if (!validation.isValid) {
            return {
                success: false,
                message: 'Registration failed',
                errors: validation.errors,
                fieldErrors: validation.fieldErrors
            };
        }
        return {
            success: true,
            message: 'User registered successfully',
            data: { email: dto.email, fullName: dto.fullName }
        };
    }
}
exports.ValidationControllerExample = ValidationControllerExample;
class ValidationServiceExample {
    async processAmbulanceRequest(dto) {
        dto_validator_util_1.DtoValidatorUtil.validateOrThrow(dto, dto_validator_util_1.DtoValidatorUtil.validateAmbulanceRequest);
        console.log('Processing valid ambulance request:', dto);
        return {
            id: 'AMB-' + Date.now(),
            status: 'PENDING',
            ...dto
        };
    }
    async processMultipleRequests(dtos) {
        const validation = dto_validator_util_1.DtoValidatorUtil.validateMultiple(dtos, dto_validator_util_1.DtoValidatorUtil.validateAmbulanceRequest);
        if (!validation.overallValid) {
            const failedIndices = validation.results
                .map((result, index) => !result.isValid ? index : -1)
                .filter(index => index !== -1);
            throw new Error(`Batch validation failed for items: ${failedIndices.join(', ')}`);
        }
        return dtos.map(dto => ({
            id: 'AMB-' + Date.now(),
            status: 'PENDING',
            ...dto
        }));
    }
}
exports.ValidationServiceExample = ValidationServiceExample;
class CustomValidationExample {
    static validateCustomData(data) {
        return dto_validator_util_1.DtoValidatorUtil.validateCustom(data, [
            {
                field: 'name',
                required: true,
                minLength: 2,
                maxLength: 50
            },
            {
                field: 'email',
                required: true,
                custom: (value) => {
                    if (!frontend_validation_service_1.FrontendValidationService['validateEmail'](value)) {
                        return 'Invalid email format';
                    }
                    return null;
                }
            },
            {
                field: 'age',
                required: false,
                custom: (value) => {
                    if (value !== undefined && (value < 0 || value > 150)) {
                        return 'Age must be between 0 and 150';
                    }
                    return null;
                }
            }
        ]);
    }
}
exports.CustomValidationExample = CustomValidationExample;
class FrontendValidationExample {
    static validateForm(formData) {
        const validation = frontend_validation_service_1.FrontendValidationService.validateAmbulanceRequest(formData);
        if (!validation.isValid) {
            return {
                isValid: false,
                fieldErrors: validation.fieldErrors,
                formErrors: {
                    patientId: validation.fieldErrors.patientId,
                    pickupLocation: validation.fieldErrors.pickupLocation,
                    contact: validation.fieldErrors.contact,
                    notes: validation.fieldErrors.notes
                }
            };
        }
        return { isValid: true };
    }
    static validateField(fieldName, value, formData) {
        const tempData = { ...formData, [fieldName]: value };
        const validation = frontend_validation_service_1.FrontendValidationService.validateAmbulanceRequest(tempData);
        return {
            isValid: !validation.fieldErrors[fieldName],
            error: validation.fieldErrors[fieldName] || ''
        };
    }
}
exports.FrontendValidationExample = FrontendValidationExample;
class ValidationMiddlewareExample {
    static validateDto(validator) {
        return (req, res, next) => {
            const validation = validator(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validation.errors,
                    fieldErrors: validation.fieldErrors
                });
            }
            next();
        };
    }
    static setupValidation() {
        return {
            'POST /ambulance': this.validateDto(dto_validator_util_1.DtoValidatorUtil.validateAmbulanceRequest),
            'POST /auth/register': this.validateDto(dto_validator_util_1.DtoValidatorUtil.validateUserRegistration)
        };
    }
}
exports.ValidationMiddlewareExample = ValidationMiddlewareExample;
//# sourceMappingURL=validation-examples.js.map