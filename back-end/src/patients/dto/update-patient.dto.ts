/**
 * Update Patient DTO - Simple data transfer object
 * Transfers patient update data between client and server
 */
export class UpdatePatientDto {
  fullName?: string;
  phone?: string;
  email?: string;
  status?: string;
  bloodGroup?: string;
  age?: number;
}
