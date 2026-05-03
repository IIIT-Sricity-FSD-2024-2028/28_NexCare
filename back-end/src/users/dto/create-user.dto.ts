/**
 * Create User DTO - Placeholder for validation decorators
 * Teammates will add class-validator decorators here
 */
export class CreateUserDto {
  name: string;
  email: string;
  role: string;
  password: string;
  patientId?: string;
  dept?: string;
}
