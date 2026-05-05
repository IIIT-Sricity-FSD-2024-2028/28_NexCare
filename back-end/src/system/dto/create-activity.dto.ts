import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create System Activity DTO
 * Transfers system activity logging data between client and server
 */
export class CreateSystemActivityDto {
  @ApiProperty({ example: 'U002', description: 'ID of the user performing the action' })
  @IsString()
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @ApiProperty({ example: 'Login', description: 'Action performed' })
  @IsString()
  @IsNotEmpty({ message: 'Action is required' })
  action: string;

  @ApiProperty({ example: 'User logged in successfully', description: 'Detailed description' })
  @IsString()
  @IsNotEmpty({ message: 'Details are required' })
  details: string;

  @ApiProperty({ example: 'Authentication', description: 'Module where action occurred' })
  @IsString()
  @IsNotEmpty({ message: 'Module is required' })
  module: string;

  @ApiProperty({ example: 'INFO', description: 'Severity level (INFO, WARNING, HIGH, CRITICAL)' })
  @IsString()
  @IsNotEmpty({ message: 'Severity is required' })
  severity: string;
}
