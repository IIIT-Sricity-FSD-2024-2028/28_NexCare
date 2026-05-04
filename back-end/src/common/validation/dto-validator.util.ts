/**
 * DTO Validator Utility
 * Provides validation methods that work with DTO objects
 * Keeps DTOs clean while providing validation functionality
 */

import { FrontendValidationService, ValidationResult } from './frontend-validation.service';
import { CreateAmbulanceRequestDto } from '../../ambulance/dto/create-request.dto';
import { RegisterDto } from '../../auth/dto/register.dto';
import { CreateAppointmentDto } from '../../appointments/dto/create-appointment.dto';
import { CreatePatientDto } from '../../patients/dto/create-patient.dto';

export class DtoValidatorUtil {
  /**
   * Validates CreateAmbulanceRequestDto
   */
  static validateAmbulanceRequest(dto: CreateAmbulanceRequestDto): ValidationResult {
    return FrontendValidationService.validateAmbulanceRequest({
      patientId: dto.patientId,
      pickupLocation: dto.pickupLocation,
      contact: dto.contact,
      notes: dto.notes
    });
  }

  /**
   * Validates RegisterDto
   */
  static validateUserRegistration(dto: RegisterDto): ValidationResult {
    return FrontendValidationService.validateUserRegistration({
      fullName: dto.fullName,
      email: dto.email,
      password: dto.password,
      phone: dto.phone,
      bloodGroup: dto.bloodGroup,
      age: dto.age
    });
  }

  /**
   * Validates CreateAppointmentDto
   */
  static validateAppointment(dto: CreateAppointmentDto): ValidationResult {
    return FrontendValidationService.validateAppointment({
      patientId: dto.patientId,
      department: dto.department,
      doctor: dto.doctor,
      dateLabel: dto.dateLabel,
      timeLabel: dto.timeLabel,
      fee: dto.fee,
      reason: dto.reason
    });
  }

  /**
   * Validates CreatePatientDto
   */
  static validatePatient(dto: CreatePatientDto): ValidationResult {
    return FrontendValidationService.validatePatient({
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      bloodGroup: dto.bloodGroup,
      age: dto.age
    });
  }

  /**
   * Generic validator for any DTO with custom validation rules
   */
  static validateCustom<T>(
    dto: T, 
    validationRules: Array<{
      field: keyof T;
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      custom?: (value: any) => string | null;
    }>
  ): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string> = {};

    for (const rule of validationRules) {
      const value = dto[rule.field];
      const fieldName = String(rule.field);

      // Required validation
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        const error = `${fieldName} is required`;
        errors.push(error);
        fieldErrors[fieldName] = error;
        continue;
      }

      // Skip other validations if field is empty and not required
      if (!value && !rule.required) {
        continue;
      }

      // String validations
      if (typeof value === 'string') {
        // Min length
        if (rule.minLength && value.length < rule.minLength) {
          const error = `${fieldName} must be at least ${rule.minLength} characters`;
          errors.push(error);
          fieldErrors[fieldName] = error;
        }

        // Max length
        if (rule.maxLength && value.length > rule.maxLength) {
          const error = `${fieldName} must be no more than ${rule.maxLength} characters`;
          errors.push(error);
          fieldErrors[fieldName] = error;
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(value)) {
          const error = `${fieldName} format is invalid`;
          errors.push(error);
          fieldErrors[fieldName] = error;
        }
      }

      // Custom validation
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

  /**
   * Validates multiple DTOs at once
   */
  static validateMultiple<T>(
    dtos: T[],
    validator: (dto: T) => ValidationResult
  ): { overallValid: boolean; results: ValidationResult[] } {
    const results = dtos.map(dto => validator(dto));
    const overallValid = results.every(result => result.isValid);

    return {
      overallValid,
      results
    };
  }

  /**
   * Validates DTO and throws error if invalid (for service layer use)
   */
  static validateOrThrow<T>(dto: T, validator: (dto: T) => ValidationResult): void {
    const result = validator(dto);
    if (!result.isValid) {
      throw new Error(`Validation failed: ${result.errors.join(', ')}`);
    }
  }
}
