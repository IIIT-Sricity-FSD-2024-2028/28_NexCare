/**
 * Validation Examples
 * Shows how to use validation with DTOs in controllers and services
 */

import { DtoValidatorUtil } from './dto-validator.util';
import { FrontendValidationService, ValidationResult } from './frontend-validation.service';
import { CreateAmbulanceRequestDto } from '../../ambulance/dto/create-request.dto';
import { RegisterDto } from '../../auth/dto/register.dto';

// ==================== CONTROLLER USAGE EXAMPLES ====================

/**
 * Example: Validation in Controller
 */
export class ValidationControllerExample {
  /**
   * Create ambulance request with validation
   */
  async createAmbulanceRequest(dto: CreateAmbulanceRequestDto) {
    // Validate DTO before processing
    const validation = DtoValidatorUtil.validateAmbulanceRequest(dto);
    
    if (!validation.isValid) {
      // Return validation errors to client
      return {
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
        fieldErrors: validation.fieldErrors
      };
    }

    // Process valid data
    return {
      success: true,
      message: 'Ambulance request created successfully',
      data: dto
    };
  }

  /**
   * User registration with validation
   */
  async registerUser(dto: RegisterDto) {
    const validation = DtoValidatorUtil.validateUserRegistration(dto);
    
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Registration failed',
        errors: validation.errors,
        fieldErrors: validation.fieldErrors
      };
    }

    // Process registration
    return {
      success: true,
      message: 'User registered successfully',
      data: { email: dto.email, fullName: dto.fullName }
    };
  }
}

// ==================== SERVICE LAYER USAGE EXAMPLES ====================

/**
 * Example: Validation in Service
 */
export class ValidationServiceExample {
  /**
   * Service method with validation
   */
  async processAmbulanceRequest(dto: CreateAmbulanceRequestDto) {
    // Validate or throw exception
    DtoValidatorUtil.validateOrThrow(
      dto, 
      DtoValidatorUtil.validateAmbulanceRequest
    );

    // Business logic here
    console.log('Processing valid ambulance request:', dto);
    
    return {
      id: 'AMB-' + Date.now(),
      status: 'PENDING',
      ...dto
    };
  }

  /**
   * Batch validation example
   */
  async processMultipleRequests(dtos: CreateAmbulanceRequestDto[]) {
    const validation = DtoValidatorUtil.validateMultiple(
      dtos,
      DtoValidatorUtil.validateAmbulanceRequest
    );

    if (!validation.overallValid) {
      const failedIndices = validation.results
        .map((result, index) => !result.isValid ? index : -1)
        .filter(index => index !== -1);

      throw new Error(
        `Batch validation failed for items: ${failedIndices.join(', ')}`
      );
    }

    // Process all valid DTOs
    return dtos.map(dto => ({
      id: 'AMB-' + Date.now(),
      status: 'PENDING',
      ...dto
    }));
  }
}

// ==================== CUSTOM VALIDATION EXAMPLES ====================

/**
 * Example: Custom validation rules
 */
export class CustomValidationExample {
  /**
   * Validate with custom rules
   */
  static validateCustomData(data: {
    name?: string;
    email?: string;
    age?: number;
  }) {
    return DtoValidatorUtil.validateCustom(data, [
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
          if (!FrontendValidationService['validateEmail'](value)) {
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

// ==================== FRONTEND INTEGRATION EXAMPLES ====================

/**
 * Example: Frontend form validation
 */
export class FrontendValidationExample {
  /**
   * React/Vue form validation example
   */
  static validateForm(formData: any) {
    const validation = FrontendValidationService.validateAmbulanceRequest(formData);
    
    if (!validation.isValid) {
      // Update form with field errors
      return {
        isValid: false,
        fieldErrors: validation.fieldErrors,
        // Map to form field names
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

  /**
   * Real-time validation example
   */
  static validateField(fieldName: string, value: string, formData: any) {
    const tempData = { ...formData, [fieldName]: value };
    const validation = FrontendValidationService.validateAmbulanceRequest(tempData);
    
    return {
      isValid: !validation.fieldErrors[fieldName],
      error: validation.fieldErrors[fieldName] || ''
    };
  }
}

// ==================== MIDDLEWARE EXAMPLE ====================

/**
 * Example: Validation middleware
 */
export class ValidationMiddlewareExample {
  /**
   * Express/NestJS validation middleware
   */
  static validateDto<T>(validator: (dto: T) => ValidationResult) {
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

  /**
   * Usage in controller
   */
  static setupValidation() {
    return {
      // Apply to specific routes
      'POST /ambulance': this.validateDto(DtoValidatorUtil.validateAmbulanceRequest),
      'POST /auth/register': this.validateDto(DtoValidatorUtil.validateUserRegistration)
    };
  }
}
