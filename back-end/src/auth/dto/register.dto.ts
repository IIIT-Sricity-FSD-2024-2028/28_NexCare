/**
 * Register DTO - Placeholder for validation decorators
 * Teammates will add class-validator decorators here
 */
export class RegisterDto {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  bloodGroup?: string;
  age?: number;
}
