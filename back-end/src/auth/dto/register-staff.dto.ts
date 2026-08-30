import { UserRole } from '../../common/interfaces/api-response.interface';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Register Staff DTO
 * Self-registration for non-patient staff accounts
 * (administrative_staff, ambulance). Unlike patient registration,
 * the role is chosen by the applicant and the account is scoped to a hospital.
 *
 * NexCare is a non-clinical platform: doctor and nurse are directory-only records
 * with no portal, created by an administrator via /users. They are deliberately
 * absent here so they can never be self-registered as login accounts.
 */
const ALLOWED_STAFF_ROLES = [
  UserRole.ADMINISTRATIVE_STAFF,
  UserRole.AMBULANCE,
];

export class RegisterStaffDto {
  @ApiProperty({ example: 'Jane Smith', description: 'Full name of the staff member' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @ApiProperty({ example: 'jane@nexcare.com', description: 'Email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Account password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ example: '5551234567', description: 'Contact phone number' })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @ApiProperty({
    enum: ALLOWED_STAFF_ROLES,
    example: UserRole.ADMINISTRATIVE_STAFF,
    description: 'Staff role to register as',
  })
  @IsIn(ALLOWED_STAFF_ROLES, {
    message: 'Role must be one of: administrative_staff, ambulance',
  })
  role: UserRole;

  @ApiProperty({ example: 'H001', description: 'Hospital the staff member belongs to' })
  @IsString()
  @IsNotEmpty({ message: 'Hospital is required' })
  hospitalId: string;

  @ApiPropertyOptional({ example: 'Front Desk', description: 'Department the staff member works in' })
  @IsOptional()
  @IsString()
  dept?: string;
}
