import { UserRole } from '../../common/interfaces/api-response.interface';
import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Create User DTO
 * Transfers user creation data between client and server
 */
export class CreateUserDto {
  @ApiProperty({ example: 'Jane Smith', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ example: 'jane@nexcare.com', description: 'Email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMINISTRATIVE_STAFF, description: 'User role' })
  @IsEnum(UserRole, { message: 'Invalid user role' })
  @IsNotEmpty({ message: 'Role is required' })
  role: UserRole;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

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
