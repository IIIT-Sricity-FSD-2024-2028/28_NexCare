import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Create Feedback DTO
 * Transfers feedback submission data between client and server
 */
export class CreateFeedbackDto {
  @ApiProperty({ example: 'P001', description: 'Patient ID' })
  @IsString()
  @IsNotEmpty({ message: 'Patient ID is required' })
  patientId: string;

  @ApiPropertyOptional({ example: 'John Anderson', description: 'Name of the person submitting feedback' })
  @IsOptional()
  @IsString()
  sender?: string;

  @ApiProperty({ example: 'Patient', description: 'Type of feedback provider' })
  @IsString()
  @IsNotEmpty({ message: 'Type is required' })
  type: string;

  @ApiProperty({ example: 'service', description: 'Category of feedback' })
  @IsString()
  @IsNotEmpty({ message: 'Category is required' })
  category: string;

  @ApiProperty({ example: 'Great doctors', description: 'Subject of feedback' })
  @IsString()
  @IsNotEmpty({ message: 'Subject is required' })
  subject: string;

  @ApiProperty({ example: 'Dr. Smith was incredibly thorough.', description: 'Detailed summary' })
  @IsString()
  @IsNotEmpty({ message: 'Summary is required' })
  summary: string;

  @ApiPropertyOptional({ example: 'H001', description: 'Hospital the feedback relates to' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiProperty({ example: 5, description: 'Rating (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty({ message: 'Rating is required' })
  rating: number;
}
