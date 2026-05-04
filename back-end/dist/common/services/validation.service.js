"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
class ValidationService {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static validatePhone(phone) {
        const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
        return phoneRegex.test(phone);
    }
    static validateBloodGroup(bloodGroup) {
        const bloodGroupRegex = /^(A|B|AB|O)[+-]$/;
        return bloodGroupRegex.test(bloodGroup);
    }
    static validatePassword(password) {
        if (password.length < 8) {
            return { isValid: false, message: 'Password must be at least 8 characters long' };
        }
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            return {
                isValid: false,
                message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            };
        }
        return { isValid: true };
    }
    static validateStringLength(value, minLength, maxLength) {
        if (value.length < minLength) {
            return { isValid: false, message: `Must be at least ${minLength} characters long` };
        }
        if (value.length > maxLength) {
            return { isValid: false, message: `Must be no more than ${maxLength} characters long` };
        }
        return { isValid: true };
    }
    static validateDateFormat(dateString) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) {
            return false;
        }
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }
    static validatePositiveNumber(value) {
        return value > 0;
    }
    static validateNonNegativeNumber(value) {
        return value >= 0;
    }
    static validateRequired(value) {
        if (value === null || value === undefined || value === '') {
            return { isValid: false, message: 'This field is required' };
        }
        return { isValid: true };
    }
    static validateEnum(value, validValues) {
        if (!validValues.includes(value)) {
            return { isValid: false, message: `Must be one of: ${validValues.join(', ')}` };
        }
        return { isValid: true };
    }
}
exports.ValidationService = ValidationService;
//# sourceMappingURL=validation.service.js.map