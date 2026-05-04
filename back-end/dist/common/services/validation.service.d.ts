export declare class ValidationService {
    static validateEmail(email: string): boolean;
    static validatePhone(phone: string): boolean;
    static validateBloodGroup(bloodGroup: string): boolean;
    static validatePassword(password: string): {
        isValid: boolean;
        message?: string;
    };
    static validateStringLength(value: string, minLength: number, maxLength: number): {
        isValid: boolean;
        message?: string;
    };
    static validateDateFormat(dateString: string): boolean;
    static validatePositiveNumber(value: number): boolean;
    static validateNonNegativeNumber(value: number): boolean;
    static validateRequired(value: any): {
        isValid: boolean;
        message?: string;
    };
    static validateEnum(value: string, validValues: string[]): {
        isValid: boolean;
        message?: string;
    };
}
