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

  @ApiPropertyOptional({ example: 'Available', description: 'Request status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'AP-03-AX-1001', description: 'Vehicle Number' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional({ example: 'Advanced Life Support (ALS)', description: 'Ambulance Type' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'Ravi Teja', description: 'Driver Name' })
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional({ example: '+91 98480 55001', description: 'Driver Phone' })
  @IsOptional()
  @IsString()
  driverPhone?: string;

  @ApiPropertyOptional({ example: '8 mins', description: 'ETA' })
  @IsOptional()
  @IsString()
  eta?: string;

  @ApiPropertyOptional({ example: 'H001', description: 'Hospital ID' })
  @IsOptional()
  @IsString()
  hospitalId?: string;
}
