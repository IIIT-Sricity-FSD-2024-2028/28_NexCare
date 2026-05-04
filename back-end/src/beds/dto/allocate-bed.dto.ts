/**
 * Allocate Bed DTO - Simple data transfer object
 * Transfers bed allocation data between client and server
 */
export class AllocateBedDto {
  patientId: string;
  admissionType?: string;
  allocatedBy?: string;
  notes?: string;
}
