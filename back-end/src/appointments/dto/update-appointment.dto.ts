import { AppointmentStatus } from '../../common/interfaces/api-response.interface';
import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update Appointment DTO
 * Transfers appointment update data between client and server
 */
export class UpdateAppointmentDto {
  @ApiPropertyOptional({ example: 'Cardiology', description: 'Department to book' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'Dr. Sarah Smith', description: 'Specific doctor' })
  @IsOptional()
  @IsString()
  doctor?: string;

  @ApiPropertyOptional({ example: 'March 15, 2026', description: 'Date of appointment' })
  @IsOptional()
  @IsString()
  dateLabel?: string;

  @ApiPropertyOptional({ example: '10:00 AM', description: 'Time of appointment' })
  @IsOptional()
  @IsString()
  timeLabel?: string;

  @ApiPropertyOptional({ example: 150, description: 'Consultation fee' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @ApiPropertyOptional({ enum: AppointmentStatus, example: AppointmentStatus.CONFIRMED, description: 'Status of the appointment' })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ example: 'Routine checkup', description: 'Reason for visit' })
  @IsOptional()
  @IsString()
  reason?: string;
}
