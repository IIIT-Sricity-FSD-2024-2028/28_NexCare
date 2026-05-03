/**
 * Create Patient DTO - Placeholder for validation decorators
 * Teammates will add class-validator decorators here
 */
export class CreatePatientDto {
  fullName: string;
  phone: string;
  email: string;
  bloodGroup?: string;
  age?: number;
}
