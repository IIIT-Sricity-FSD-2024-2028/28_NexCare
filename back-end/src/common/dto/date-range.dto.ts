import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Date Range DTO
 * Transfers date range filtering data
 */
export class DateRangeDto {
  @ApiPropertyOptional({ example: '2026-03-01T00:00:00Z', description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-03-31T23:59:59Z', description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
