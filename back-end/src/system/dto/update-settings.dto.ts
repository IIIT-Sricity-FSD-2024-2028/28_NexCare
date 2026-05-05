import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update System Settings DTO
 * Transfers system settings update data between client and server
 */
export class UpdateSystemSettingsDto {
  @ApiProperty({ example: 'NexCare Hospital', description: 'New value for the setting' })
  @IsString()
  @IsNotEmpty({ message: 'Value is required' })
  value: string;

  @ApiPropertyOptional({ example: 'Hospital name for display purposes', description: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;
}
