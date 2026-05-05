import { IsEmail, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update Patient DTO
 * Transfers patient update data between client and server
 */
export class UpdatePatientDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'Full name of the patient' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '+1 (555) 123-4567', description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Email address' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({ example: 'Active', description: 'Patient status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'O+', description: 'Blood group' })
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional({ example: 35, description: 'Age of the patient' })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Age cannot be negative' })
  age?: number;
}
