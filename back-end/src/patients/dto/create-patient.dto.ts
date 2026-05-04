/**
 * Create Patient DTO - Simple data transfer object
 * Transfers patient creation data between client and server
 */
export class CreatePatientDto {
  fullName: string;
  phone: string;
  email: string;
  bloodGroup?: string;
  age?: number;
}
