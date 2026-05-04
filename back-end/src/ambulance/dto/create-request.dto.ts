/**
 * Create Ambulance Request DTO - Simple data transfer object
 * Transfers ambulance request data between client and server
 */
export class CreateAmbulanceRequestDto {
  patientId: string;
  pickupLocation: string;
  contact: string;
  notes?: string;
}
