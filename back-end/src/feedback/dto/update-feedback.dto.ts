import { FeedbackStatus } from '../../common/interfaces/api-response.interface';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update Feedback DTO
 * Transfers feedback update data between client and server
 */
export class UpdateFeedbackDto {
  @ApiPropertyOptional({ example: 'service', description: 'Category of feedback' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Great doctors', description: 'Subject of feedback' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ example: 'Dr. Smith was incredibly thorough.', description: 'Detailed summary' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ example: 5, description: 'Rating (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ enum: FeedbackStatus, example: FeedbackStatus.IN_PROGRESS, description: 'Status of feedback' })
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;
}
