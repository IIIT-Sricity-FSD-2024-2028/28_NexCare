import { ValidationResult } from './frontend-validation.service';
import { CreateAmbulanceRequestDto } from '../../ambulance/dto/create-request.dto';
import { RegisterDto } from '../../auth/dto/register.dto';
export declare class ValidationControllerExample {
    createAmbulanceRequest(dto: CreateAmbulanceRequestDto): Promise<{
        success: boolean;
        message: string;
        errors: string[];
        fieldErrors: Record<string, string>;
        data?: undefined;
    } | {
        success: boolean;
        message: string;
        data: CreateAmbulanceRequestDto;
        errors?: undefined;
        fieldErrors?: undefined;
    }>;
    registerUser(dto: RegisterDto): Promise<{
        success: boolean;
        message: string;
        errors: string[];
        fieldErrors: Record<string, string>;
        data?: undefined;
    } | {
        success: boolean;
        message: string;
        data: {
            email: string;
            fullName: string;
        };
        errors?: undefined;
        fieldErrors?: undefined;
    }>;
}
export declare class ValidationServiceExample {
    processAmbulanceRequest(dto: CreateAmbulanceRequestDto): Promise<{
        patientId: string;
        pickupLocation: string;
        contact: string;
        notes?: string;
        id: string;
        status: string;
    }>;
    processMultipleRequests(dtos: CreateAmbulanceRequestDto[]): Promise<{
        patientId: string;
        pickupLocation: string;
        contact: string;
        notes?: string;
        id: string;
        status: string;
    }[]>;
}
export declare class CustomValidationExample {
    static validateCustomData(data: {
        name?: string;
        email?: string;
        age?: number;
    }): ValidationResult;
}
export declare class FrontendValidationExample {
    static validateForm(formData: any): {
        isValid: boolean;
        fieldErrors: Record<string, string>;
        formErrors: {
            patientId: string;
            pickupLocation: string;
            contact: string;
            notes: string;
        };
    } | {
        isValid: boolean;
        fieldErrors?: undefined;
        formErrors?: undefined;
    };
    static validateField(fieldName: string, value: string, formData: any): {
        isValid: boolean;
        error: string;
    };
}
export declare class ValidationMiddlewareExample {
    static validateDto<T>(validator: (dto: T) => ValidationResult): (req: any, res: any, next: any) => any;
    static setupValidation(): {
        'POST /ambulance': (req: any, res: any, next: any) => any;
        'POST /auth/register': (req: any, res: any, next: any) => any;
    };
}
