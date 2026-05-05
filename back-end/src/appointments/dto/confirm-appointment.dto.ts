import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Confirm Appointment DTO
 * Transfers appointment confirmation data between client and server
 */
export class ConfirmAppointmentDto {
  @ApiPropertyOptional({ example: 'Please arrive 15 minutes early', description: 'Additional notes for confirmation' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'U002', description: 'ID of staff who confirmed' })
  @IsOptional()
  @IsString()
  confirmedBy?: string;
}
