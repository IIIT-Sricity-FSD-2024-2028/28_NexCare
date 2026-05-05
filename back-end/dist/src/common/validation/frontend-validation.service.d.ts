export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    fieldErrors?: Record<string, string>;
}
export declare class FrontendValidationService {
    static validateAmbulanceRequest(data: {
        patientId?: string;
        pickupLocation?: string;
        contact?: string;
        notes?: string;
    }): ValidationResult;
    static validateUserRegistration(data: {
        fullName?: string;
        email?: string;
        password?: string;
        phone?: string;
        bloodGroup?: string;
        age?: number;
    }): ValidationResult;
    static validateAppointment(data: {
        patientId?: string;
        department?: string;
        doctor?: string;
        dateLabel?: string;
        timeLabel?: string;
        fee?: number;
        reason?: string;
    }): ValidationResult;
    static validatePatient(data: {
        fullName?: string;
        phone?: string;
        email?: string;
        bloodGroup?: string;
        age?: number;
    }): ValidationResult;
    private static validateEmail;
    private static validatePhone;
    private static validateBloodGroup;
    private static validatePassword;
    private static validateDateFormat;
}
