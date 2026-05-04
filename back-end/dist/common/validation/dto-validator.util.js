"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DtoValidatorUtil = void 0;
const frontend_validation_service_1 = require("./frontend-validation.service");
class DtoValidatorUtil {
    static validateAmbulanceRequest(dto) {
        return frontend_validation_service_1.FrontendValidationService.validateAmbulanceRequest({
            patientId: dto.patientId,
            pickupLocation: dto.pickupLocation,
            contact: dto.contact,
            notes: dto.notes
        });
    }
    static validateUserRegistration(dto) {
        return frontend_validation_service_1.FrontendValidationService.validateUserRegistration({
            fullName: dto.fullName,
            email: dto.email,
            password: dto.password,
            phone: dto.phone,
            bloodGroup: dto.bloodGroup,
            age: dto.age
        });
    }
    static validateAppointment(dto) {
        return frontend_validation_service_1.FrontendValidationService.validateAppointment({
            patientId: dto.patientId,
            department: dto.department,
            doctor: dto.doctor,
            dateLabel: dto.dateLabel,
            timeLabel: dto.timeLabel,
            fee: dto.fee,
            reason: dto.reason
        });
    }
    static validatePatient(dto) {
        return frontend_validation_service_1.FrontendValidationService.validatePatient({
            fullName: dto.fullName,
            phone: dto.phone,
            email: dto.email,
            bloodGroup: dto.bloodGroup,
            age: dto.age
        });
    }
    static validateCustom(dto, validationRules) {
        const errors = [];
        const fieldErrors = {};
        for (const rule of validationRules) {
            const value = dto[rule.field];
            const fieldName = String(rule.field);
            if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
                const error = `${fieldName} is required`;
                errors.push(error);
                fieldErrors[fieldName] = error;
                continue;
            }
            if (!value && !rule.required) {
                continue;
            }
            if (typeof value === 'string') {
                if (rule.minLength && value.length < rule.minLength) {
                    const error = `${fieldName} must be at least ${rule.minLength} characters`;
                    errors.push(error);
                    fieldErrors[fieldName] = error;
                }
                if (rule.maxLength && value.length > rule.maxLength) {
                    const error = `${fieldName} must be no more than ${rule.maxLength} characters`;
                    errors.push(error);
                    fieldErrors[fieldName] = error;
                }
                if (rule.pattern && !rule.pattern.test(value)) {
                    const error = `${fieldName} format is invalid`;
                    errors.push(error);
                    fieldErrors[fieldName] = error;
                }
            }
            if (rule.custom) {
                const customError = rule.custom(value);
                if (customError) {
                    errors.push(customError);
                    fieldErrors[fieldName] = customError;
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            fieldErrors
        };
    }
    static validateMultiple(dtos, validator) {
        const results = dtos.map(dto => validator(dto));
        const overallValid = results.every(result => result.isValid);
        return {
            overallValid,
            results
        };
    }
    static validateOrThrow(dto, validator) {
        const result = validator(dto);
        if (!result.isValid) {
            throw new Error(`Validation failed: ${result.errors.join(', ')}`);
        }
    }
}
exports.DtoValidatorUtil = DtoValidatorUtil;
//# sourceMappingURL=dto-validator.util.js.map