"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendValidationService = void 0;
class FrontendValidationService {
    static validateAmbulanceRequest(data) {
        const errors = [];
        const fieldErrors = {};
        if (!data.patientId || data.patientId.trim() === '') {
            errors.push('Patient ID is required');
            fieldErrors.patientId = 'Patient ID is required';
        }
        else if (data.patientId.length < 3) {
            errors.push('Patient ID must be at least 3 characters');
            fieldErrors.patientId = 'Patient ID must be at least 3 characters';
        }
        if (!data.pickupLocation || data.pickupLocation.trim() === '') {
            errors.push('Pickup location is required');
            fieldErrors.pickupLocation = 'Pickup location is required';
        }
        else if (data.pickupLocation.length < 5) {
            errors.push('Pickup location must be at least 5 characters');
            fieldErrors.pickupLocation = 'Pickup location must be at least 5 characters';
        }
        if (!data.contact || data.contact.trim() === '') {
            errors.push('Contact number is required');
            fieldErrors.contact = 'Contact number is required';
        }
        else if (!this.validatePhone(data.contact)) {
            errors.push('Invalid phone number format');
            fieldErrors.contact = 'Invalid phone number format';
        }
        if (data.notes && data.notes.length > 1000) {
            errors.push('Notes must be less than 1000 characters');
            fieldErrors.notes = 'Notes must be less than 1000 characters';
        }
        return {
            isValid: errors.length === 0,
            errors,
            fieldErrors
        };
    }
    static validateUserRegistration(data) {
        const errors = [];
        const fieldErrors = {};
        if (!data.fullName || data.fullName.trim() === '') {
            errors.push('Full name is required');
            fieldErrors.fullName = 'Full name is required';
        }
        else if (data.fullName.length < 2 || data.fullName.length > 100) {
            errors.push('Full name must be between 2 and 100 characters');
            fieldErrors.fullName = 'Full name must be between 2 and 100 characters';
        }
        if (!data.email || data.email.trim() === '') {
            errors.push('Email is required');
            fieldErrors.email = 'Email is required';
        }
        else if (!this.validateEmail(data.email)) {
            errors.push('Invalid email format');
            fieldErrors.email = 'Invalid email format';
        }
        if (!data.password || data.password.trim() === '') {
            errors.push('Password is required');
            fieldErrors.password = 'Password is required';
        }
        else {
            const passwordValidation = this.validatePassword(data.password);
            if (!passwordValidation.isValid) {
                errors.push(passwordValidation.message || 'Invalid password');
                fieldErrors.password = passwordValidation.message || 'Invalid password';
            }
        }
        if (!data.phone || data.phone.trim() === '') {
            errors.push('Phone number is required');
            fieldErrors.phone = 'Phone number is required';
        }
        else if (!this.validatePhone(data.phone)) {
            errors.push('Invalid phone number format');
            fieldErrors.phone = 'Invalid phone number format';
        }
        if (data.bloodGroup && !this.validateBloodGroup(data.bloodGroup)) {
            errors.push('Invalid blood group format');
            fieldErrors.bloodGroup = 'Invalid blood group format';
        }
        if (data.age !== undefined) {
            if (typeof data.age !== 'number' || data.age < 0 || data.age > 150) {
                errors.push('Age must be a valid number between 0 and 150');
                fieldErrors.age = 'Age must be a valid number between 0 and 150';
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            fieldErrors
        };
    }
    static validateAppointment(data) {
        const errors = [];
        const fieldErrors = {};
        if (!data.patientId || data.patientId.trim() === '') {
            errors.push('Patient ID is required');
            fieldErrors.patientId = 'Patient ID is required';
        }
        if (!data.department || data.department.trim() === '') {
            errors.push('Department is required');
            fieldErrors.department = 'Department is required';
        }
        else if (data.department.length < 2 || data.department.length > 100) {
            errors.push('Department must be between 2 and 100 characters');
            fieldErrors.department = 'Department must be between 2 and 100 characters';
        }
        if (!data.dateLabel || data.dateLabel.trim() === '') {
            errors.push('Date is required');
            fieldErrors.dateLabel = 'Date is required';
        }
        else if (!this.validateDateFormat(data.dateLabel)) {
            errors.push('Invalid date format');
            fieldErrors.dateLabel = 'Invalid date format';
        }
        if (!data.timeLabel || data.timeLabel.trim() === '') {
            errors.push('Time is required');
            fieldErrors.timeLabel = 'Time is required';
        }
        if (data.fee !== undefined) {
            if (typeof data.fee !== 'number' || data.fee < 0) {
                errors.push('Fee must be a valid positive number');
                fieldErrors.fee = 'Fee must be a valid positive number';
            }
        }
        if (data.reason && data.reason.length > 500) {
            errors.push('Reason must be less than 500 characters');
            fieldErrors.reason = 'Reason must be less than 500 characters';
        }
        return {
            isValid: errors.length === 0,
            errors,
            fieldErrors
        };
    }
    static validatePatient(data) {
        const errors = [];
        const fieldErrors = {};
        if (!data.fullName || data.fullName.trim() === '') {
            errors.push('Full name is required');
            fieldErrors.fullName = 'Full name is required';
        }
        else if (data.fullName.length < 2 || data.fullName.length > 100) {
            errors.push('Full name must be between 2 and 100 characters');
            fieldErrors.fullName = 'Full name must be between 2 and 100 characters';
        }
        if (!data.phone || data.phone.trim() === '') {
            errors.push('Phone number is required');
            fieldErrors.phone = 'Phone number is required';
        }
        else if (!this.validatePhone(data.phone)) {
            errors.push('Invalid phone number format');
            fieldErrors.phone = 'Invalid phone number format';
        }
        if (!data.email || data.email.trim() === '') {
            errors.push('Email is required');
            fieldErrors.email = 'Email is required';
        }
        else if (!this.validateEmail(data.email)) {
            errors.push('Invalid email format');
            fieldErrors.email = 'Invalid email format';
        }
        if (data.bloodGroup && !this.validateBloodGroup(data.bloodGroup)) {
            errors.push('Invalid blood group format');
            fieldErrors.bloodGroup = 'Invalid blood group format';
        }
        if (data.age !== undefined) {
            if (typeof data.age !== 'number' || data.age < 0 || data.age > 150) {
                errors.push('Age must be a valid number between 0 and 150');
                fieldErrors.age = 'Age must be a valid number between 0 and 150';
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            fieldErrors
        };
    }
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static validatePhone(phone) {
        const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
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
    static validateDateFormat(dateString) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) {
            return false;
        }
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }
}
exports.FrontendValidationService = FrontendValidationService;
//# sourceMappingURL=frontend-validation.service.js.map