import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Dispatch Ambulance DTO
 * Transfers ambulance dispatch data between client and server
 */
export class DispatchAmbulanceDto {
  @ApiProperty({ example: 'U003', description: 'ID of staff assigned' })
  @IsString()
  @IsNotEmpty({ message: 'Assigned staff is required' })
  assignedTo: string;

  @ApiPropertyOptional({ example: 'AMB-101', description: 'Vehicle number' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional({ example: '+1 (555) 999-8888', description: 'Driver contact number' })
  @IsOptional()
  @IsString()
  driverContact?: string;

  @ApiPropertyOptional({ example: '10:30 AM', description: 'Estimated arrival time' })
  @IsOptional()
  @IsString()
  estimatedArrival?: string;

  @ApiProperty({ example: 'U002', description: 'Staff ID who dispatched (optional - will be auto-filled from JWT token if not provided)' })
  @IsString()
  @IsOptional()
  dispatchedBy?: string;
}
