import { UserRole } from '../../common/interfaces/api-response.interface';
import { IsEmail, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Register Staff DTO
 * Self-registration for non-patient staff accounts
 * (administrative_staff, ambulance). Unlike patient registration,
 * the role is chosen by the applicant and the account is scoped to a hospital.
 *
 * Doctors self-register here too. They are login actors with their own portal:
 * they manage their schedule, action their own appointments, and buy a listing
 * tier from the platform. Nurses remain directory-only records created by an
 * administrator via /users — they have no portal and cannot self-register.
 */
const ALLOWED_STAFF_ROLES = [
  UserRole.ADMINISTRATIVE_STAFF,
  UserRole.AMBULANCE,
  UserRole.DOCTOR,
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
    message: 'Role must be one of: administrative_staff, ambulance, doctor',
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

  // ── Doctor-only fields ──────────────────────────────────────────────────
  // Optional at the DTO level because the same endpoint serves three roles;
  // AuthService requires the specialisation when role is 'doctor'.

  @ApiPropertyOptional({ example: 'Cardiology', description: 'Clinical specialisation (doctors)' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ example: 'APMC-45219', description: 'Medical council registration number (doctors)' })
  @IsOptional()
  @IsString()
  registrationNo?: string;

  @ApiPropertyOptional({ example: 600, description: 'Consultation fee charged per appointment (doctors)' })
  @IsOptional()
  @IsNumber({}, { message: 'Consultation fee must be a number' })
  @Min(0, { message: 'Consultation fee cannot be negative' })
  consultationFee?: number;
}
