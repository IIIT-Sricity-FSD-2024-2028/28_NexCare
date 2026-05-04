/**
 * Register DTO - Simple data transfer object
 * Transfers patient registration data between client and server
 */
export class RegisterDto {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  bloodGroup?: string;
  age?: number;
}
