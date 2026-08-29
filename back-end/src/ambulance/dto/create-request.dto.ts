import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Create Ambulance Request DTO
 * Transfers ambulance request data between client and server
 */
export class CreateAmbulanceRequestDto {
  @ApiProperty({ example: 'P001', description: 'ID of the patient requesting' })
  @IsString()
  @IsNotEmpty({ message: 'Patient ID is required' })
  patientId: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Name of the patient requesting' })
  @IsOptional()
  @IsString()
  patientName?: string;

  @ApiProperty({ example: '123 Main Street', description: 'Pickup location address' })
  @IsString()
  @IsNotEmpty({ message: 'Pickup location is required' })
  pickupLocation: string;

  @ApiProperty({ example: '+1 (555) 123-4567', description: 'Contact phone number' })
  @IsString()
  @IsNotEmpty({ message: 'Contact is required' })
  contact: string;

  @ApiPropertyOptional({ example: 'Patient has chest pain', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  // AmbulanceService.create rejects a request without a hospitalId, but this field
  // was never declared here — so omitting it failed in the service and sending it
  // failed the ValidationPipe. There was no payload that worked and the patient
  // ambulance request was impossible to submit. Declared optional; the service
  // remains the thing that enforces it.
  @ApiPropertyOptional({ example: 'H001', description: 'Hospital the ambulance is dispatched from' })
  @IsOptional()
  @IsString()
  hospitalId?: string;
}
