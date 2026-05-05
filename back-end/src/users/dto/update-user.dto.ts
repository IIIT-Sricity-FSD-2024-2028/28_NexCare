import { UserRole, UserStatus } from '../../common/interfaces/api-response.interface';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update User DTO
 * Transfers user update data between client and server
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane Smith', description: 'Full name of the user' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'jane@nexcare.com', description: 'Email address' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.DOCTOR, description: 'User role' })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid user role' })
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.ACTIVE, description: 'User status' })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Invalid user status' })
  status?: UserStatus;

  @ApiPropertyOptional({ example: 'password123', description: 'User password' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @ApiPropertyOptional({ example: 'P1002', description: 'Associated patient ID if applicable' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ example: 'Cardiology', description: 'Department (for doctors/staff)' })
  @IsOptional()
  @IsString()
  dept?: string;
}
