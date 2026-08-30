import { AmbulanceStatus } from '../../common/interfaces/api-response.interface';
import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update Ambulance Request DTO
 * Transfers ambulance request update data between client and server
 */
export class UpdateAmbulanceRequestDto {
  @ApiPropertyOptional({ example: '123 Main Street', description: 'Pickup location address' })
  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @ApiPropertyOptional({ example: '+1 (555) 123-4567', description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional({ example: 'Patient has chest pain', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Available', description: 'Request / Fleet status' })
  @IsOptional()
  @IsString()
  status?: any;

  @ApiPropertyOptional({ example: 'AP-03-AX-1001', description: 'Vehicle registration number' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional({ example: 'Advanced Life Support (ALS)', description: 'Ambulance service type' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'Ravi Teja', description: 'Assigned driver name' })
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional({ example: '+91 98480 55001', description: 'Driver contact phone' })
  @IsOptional()
  @IsString()
  driverPhone?: string;

  @ApiPropertyOptional({ example: '8 mins', description: 'ETA or standby location' })
  @IsOptional()
  @IsString()
  eta?: string;

  @ApiPropertyOptional({ example: 'H001', description: 'Hospital ID' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ example: 'Maria Garcia', description: 'Patient Name' })
  @IsOptional()
  @IsString()
  patientName?: string;

  @ApiPropertyOptional({ example: 'U003', description: 'Staff assigned' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ example: 0, description: 'Current step index in transport' })
  @IsOptional()
  @IsNumber()
  stepIndex?: number;

  @ApiPropertyOptional({ example: 'May 5, 2026', description: 'Date the transport was completed' })
  @IsOptional()
  @IsString()
  completedDate?: string;

  @ApiPropertyOptional({ example: '10:30 AM', description: 'Time the transport was completed' })
  @IsOptional()
  @IsString()
  completedTime?: string;
}
