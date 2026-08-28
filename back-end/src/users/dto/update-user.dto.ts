import { UserRole, UserStatus } from '../../common/interfaces/api-response.interface';
import { IsArray, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
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

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.ADMINISTRATIVE_STAFF, description: 'User role' })
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

  @ApiPropertyOptional({ example: 'Cardiology', description: 'Department within the hospital' })
  @IsOptional()
  @IsString()
  dept?: string;

  @ApiPropertyOptional({ example: 'H001', description: 'Hospital the user belongs to' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ example: ['Tirupati', 'Renigunta'], description: 'Local areas assigned to a regional manager' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areas?: string[];
}
