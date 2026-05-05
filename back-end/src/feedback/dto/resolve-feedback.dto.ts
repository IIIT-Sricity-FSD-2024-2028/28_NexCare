import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Resolve Feedback DTO
 * Transfers feedback resolution data between client and server
 */
export class ResolveFeedbackDto {
  @ApiProperty({ example: 'Issue has been discussed with staff', description: 'Resolution provided' })
  @IsString()
  @IsNotEmpty({ message: 'Resolution is required' })
  resolution: string;

  @ApiPropertyOptional({ example: 'U002', description: 'Staff who resolved the feedback' })
  @IsOptional()
  @IsString()
  resolvedBy?: string;

  @ApiPropertyOptional({ example: 'Yes', description: 'Is follow-up required?' })
  @IsOptional()
  @IsString()
  followUpRequired?: string;

  @ApiPropertyOptional({ example: 'Will check back in 1 week', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
