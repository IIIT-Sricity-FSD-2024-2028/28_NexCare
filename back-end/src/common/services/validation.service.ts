/**
 * Validation Service
 * Handles all validation logic separately from DTOs
 * DTOs are simple data transfer objects - no validation decorators
 */

export class ValidationService {
  /**
   * Validates email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates phone number format
   */
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validates blood group format
   */
  static validateBloodGroup(bloodGroup: string): boolean {
    const bloodGroupRegex = /^(A|B|AB|O)[+-]$/;
    return bloodGroupRegex.test(bloodGroup);
  }

  /**
   * Validates password complexity
   */
  static validatePassword(password: string): { isValid: boolean; message?: string } {
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

  /**
   * Validates string length
   */
  static validateStringLength(value: string, minLength: number, maxLength: number): { isValid: boolean; message?: string } {
    if (value.length < minLength) {
      return { isValid: false, message: `Must be at least ${minLength} characters long` };
    }
    
    if (value.length > maxLength) {
      return { isValid: false, message: `Must be no more than ${maxLength} characters long` };
    }

    return { isValid: true };
  }

  /**
   * Validates date format (YYYY-MM-DD)
   */
  static validateDateFormat(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Validates positive number
   */
  static validatePositiveNumber(value: number): boolean {
    return value > 0;
  }

  /**
   * Validates non-negative number
   */
  static validateNonNegativeNumber(value: number): boolean {
    return value >= 0;
  }

  /**
   * Validates required field
   */
  static validateRequired(value: any): { isValid: boolean; message?: string } {
    if (value === null || value === undefined || value === '') {
      return { isValid: false, message: 'This field is required' };
    }
    return { isValid: true };
  }

  /**
   * Validates enum value
   */
  static validateEnum(value: string, validValues: string[]): { isValid: boolean; message?: string } {
    if (!validValues.includes(value)) {
      return { isValid: false, message: `Must be one of: ${validValues.join(', ')}` };
    }
    return { isValid: true };
  }
}
