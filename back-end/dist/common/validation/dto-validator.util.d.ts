import { ValidationResult } from './frontend-validation.service';
import { CreateAmbulanceRequestDto } from '../../ambulance/dto/create-request.dto';
import { RegisterDto } from '../../auth/dto/register.dto';
import { CreateAppointmentDto } from '../../appointments/dto/create-appointment.dto';
import { CreatePatientDto } from '../../patients/dto/create-patient.dto';
export declare class DtoValidatorUtil {
    static validateAmbulanceRequest(dto: CreateAmbulanceRequestDto): ValidationResult;
    static validateUserRegistration(dto: RegisterDto): ValidationResult;
    static validateAppointment(dto: CreateAppointmentDto): ValidationResult;
    static validatePatient(dto: CreatePatientDto): ValidationResult;
    static validateCustom<T>(dto: T, validationRules: Array<{
        field: keyof T;
        required?: boolean;
        minLength?: number;
        maxLength?: number;
        pattern?: RegExp;
        custom?: (value: any) => string | null;
    }>): ValidationResult;
    static validateMultiple<T>(dtos: T[], validator: (dto: T) => ValidationResult): {
        overallValid: boolean;
        results: ValidationResult[];
    };
    static validateOrThrow<T>(dto: T, validator: (dto: T) => ValidationResult): void;
}
