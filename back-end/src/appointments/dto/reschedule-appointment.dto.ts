import { IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Reschedule Appointment DTO
 * The new slot for an existing appointment; omitted fields keep their current value
 */
export class RescheduleAppointmentDto {
  @ApiPropertyOptional({ example: 'HOSP-001', description: 'Hospital ID' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ example: 'City General Hospital', description: 'Hospital name' })
  @IsOptional()
  @IsString()
  hospitalName?: string;

  @ApiPropertyOptional({ example: 'Cardiology', description: 'Department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'Dr. Sarah Smith', description: 'Doctor name' })
  @IsOptional()
  @IsString()
  doctor?: string;

  @ApiPropertyOptional({ example: 'USR-DOC-001', description: 'Doctor user ID' })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiProperty({ example: 'March 15, 2026', description: 'New date of appointment' })
  @IsString()
  @IsNotEmpty({ message: 'Date label is required' })
  dateLabel: string;

  @ApiProperty({ example: '10:00 AM', description: 'New time of appointment' })
  @IsString()
  @IsNotEmpty({ message: 'Time label is required' })
  timeLabel: string;

  @ApiPropertyOptional({ example: 150, description: 'Consultation fee' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @ApiPropertyOptional({ example: 'Routine checkup', description: 'Reason for visit' })
  @IsOptional()
  @IsString()
  reason?: string;
}
