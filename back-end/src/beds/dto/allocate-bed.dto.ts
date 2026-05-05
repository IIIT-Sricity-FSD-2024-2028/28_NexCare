import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Allocate Bed DTO
 * Transfers bed allocation data between client and server
 */
export class AllocateBedDto {
  @ApiProperty({ example: 'P001', description: 'ID of the patient' })
  @IsString()
  @IsNotEmpty({ message: 'Patient ID is required' })
  patientId: string;

  @ApiPropertyOptional({ example: 'Emergency', description: 'Type of admission' })
  @IsOptional()
  @IsString()
  admissionType?: string;

  @ApiPropertyOptional({ example: 'U002', description: 'Staff who allocated the bed' })
  @IsOptional()
  @IsString()
  allocatedBy?: string;

  @ApiPropertyOptional({ example: 'Patient needs monitoring', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
