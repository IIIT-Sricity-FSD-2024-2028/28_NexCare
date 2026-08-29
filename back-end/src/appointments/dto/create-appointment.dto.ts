import { IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Create Appointment DTO
 * Transfers appointment creation data between client and server
 */
export class CreateAppointmentDto {
  @ApiProperty({ example: 'P001', description: 'ID of the patient' })
  @IsString()
  @IsNotEmpty({ message: 'Patient ID is required' })
  patientId: string;

  @ApiProperty({ example: 'Cardiology', description: 'Department to book' })
  @IsString()
  @IsNotEmpty({ message: 'Department is required' })
  department: string;

  @ApiPropertyOptional({ example: 'Dr. Sarah Smith', description: 'Specific doctor' })
  @IsOptional()
  @IsString()
  doctor?: string;

  @ApiProperty({ example: 'March 15, 2026', description: 'Date of appointment' })
  @IsString()
  @IsNotEmpty({ message: 'Date label is required' })
  dateLabel: string;

  @ApiProperty({ example: '10:00 AM', description: 'Time of appointment' })
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

  // The booking wizard already asks the patient to pick a hospital, and db.js
  // sends both of these. Neither was declared, so the ValidationPipe
  // (forbidNonWhitelisted) rejected every booking with 400 "property
  // hospitalName should not exist" — and no appointment, and therefore no bill,
  // could be attributed to a hospital.
  @ApiPropertyOptional({ example: 'H001', description: 'Hospital the appointment is booked at' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ example: 'Apollo Health City', description: 'Hospital name, denormalised for display' })
  @IsOptional()
  @IsString()
  hospitalName?: string;
}
