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

  @ApiPropertyOptional({ enum: AmbulanceStatus, example: AmbulanceStatus.PENDING, description: 'Request status' })
  @IsOptional()
  @IsEnum(AmbulanceStatus)
  status?: AmbulanceStatus;

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
