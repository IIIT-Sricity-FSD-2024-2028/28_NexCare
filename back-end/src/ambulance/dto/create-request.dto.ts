/**
 * Create Ambulance Request DTO - Placeholder for validation decorators
 * Teammates will add class-validator decorators here
 */
export class CreateAmbulanceRequestDto {
  patientId: string;
  pickupLocation: string;
  contact: string;
  notes?: string;
}
