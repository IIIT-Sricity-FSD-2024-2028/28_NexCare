import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Register DTO
 * Transfers patient registration data between client and server
 */
export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the patient' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ example: '+1 (555) 123-4567', description: 'Contact phone number' })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

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
