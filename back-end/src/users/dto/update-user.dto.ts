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
  status?: any;

  @ApiPropertyOptional({ example: 'password123', description: 'User password' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: false, description: 'Must change password flag' })
  @IsOptional()
  mustChangePassword?: boolean;

  @ApiPropertyOptional({ example: 'R001', description: 'Region ID' })
  @IsOptional()
  @IsString()
  regionId?: string;

  @ApiPropertyOptional({ example: '123 Main Street', description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 500, description: 'Consultation fee' })
  @IsOptional()
  consultationFee?: number | string;

  @ApiPropertyOptional({ example: '+91 98480 12345', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '1985-05-15', description: 'Date of birth' })
  @IsOptional()
  @IsString()
  dob?: string;

  @ApiPropertyOptional({ example: 'Female', description: 'Gender' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: 'EMP-1042', description: 'Employee ID' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ example: 'Cardiology', description: 'Department within the hospital' })
  @IsOptional()
  @IsString()
  dept?: string;

  @ApiPropertyOptional({ example: 'Senior Resident', description: 'Designation' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: '2026-01-10', description: 'Joining date' })
  @IsOptional()
  @IsString()
  joiningDate?: string;

  @ApiPropertyOptional({ example: 'Full-time', description: 'Employment type' })
  @IsOptional()
  @IsString()
  employmentType?: string;

  @ApiPropertyOptional({ example: 'H001', description: 'Hospital the user belongs to' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ example: 'NexCare AIIMS Super Speciality Hospital', description: 'Hospital name' })
  @IsOptional()
  @IsString()
  hospitalName?: string;

  @ApiPropertyOptional({ example: 'Interventional Cardiology', description: 'Doctor specialization' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ example: 'MCI-88492', description: 'Medical registration number' })
  @IsOptional()
  @IsString()
  medicalRegNumber?: string;

  @ApiPropertyOptional({ example: 'MBBS, MD, DM', description: 'Doctor qualification' })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({ example: 8, description: 'Years of experience' })
  @IsOptional()
  experienceYears?: number | string;

  @ApiPropertyOptional({ example: '09:00 AM - 01:00 PM', description: 'Consultation timing' })
  @IsOptional()
  @IsString()
  consultationTiming?: string;

  @ApiPropertyOptional({ example: 'DL-04-2018-99281', description: 'Driver license number' })
  @IsOptional()
  @IsString()
  driverLicense?: string;

  @ApiPropertyOptional({ example: 'AP-03-AX-1002', description: 'Assigned ambulance vehicle' })
  @IsOptional()
  @IsString()
  assignedVehicle?: string;

  @ApiPropertyOptional({ example: 'Day Shift (08:00 - 16:00)', description: 'Duty shift' })
  @IsOptional()
  @IsString()
  shift?: string;

  @ApiPropertyOptional({ example: ['Bed Allocation', 'Inventory Requisitions'], description: 'Assigned responsibilities' })
  @IsOptional()
  responsibilities?: any;

  @ApiPropertyOptional({ example: 'P1002', description: 'Associated patient ID if applicable' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ example: ['Tirupati', 'Renigunta'], description: 'Local areas assigned to a regional manager' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areas?: string[];
}
