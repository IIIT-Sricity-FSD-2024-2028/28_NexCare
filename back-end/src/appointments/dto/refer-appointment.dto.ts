import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Body for referring a patient to another doctor after (or with) completing a consult.
 */
export class ReferAppointmentDto {
  @ApiProperty({ example: 'U012', description: 'User id of the doctor being referred to' })
  @IsString()
  @IsNotEmpty({ message: 'Doctor is required' })
  doctorId: string;

  @ApiPropertyOptional({ example: 'Cardiology', description: 'Department of the follow-up visit' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ example: 'March 20, 2026', description: 'Date of the follow-up appointment' })
  @IsString()
  @IsNotEmpty({ message: 'Date is required' })
  dateLabel: string;

  @ApiProperty({ example: '11:00 AM', description: 'Time of the follow-up appointment' })
  @IsString()
  @IsNotEmpty({ message: 'Time is required' })
  timeLabel: string;

  @ApiPropertyOptional({ example: 500, description: 'Consultation fee for the follow-up (defaults to that doctor’s fee)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Also mark the current appointment complete (default true when it is still confirmed)',
  })
  @IsOptional()
  @IsBoolean()
  completeCurrent?: boolean;
}
