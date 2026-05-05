import { BillStatus } from '../../common/interfaces/api-response.interface';
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BillItemDto } from './create-bill.dto';

/**
 * Update Bill DTO
 * Transfers bill update data between client and server
 */
export class UpdateBillDto {
  @ApiPropertyOptional({ example: '2026-03-01T00:00:00Z', description: 'Date of visit' })
  @IsOptional()
  @IsString()
  visitDate?: string;

  @ApiPropertyOptional({ example: '2026-03-15T00:00:00Z', description: 'Due date for payment' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ enum: BillStatus, example: BillStatus.PENDING, description: 'Status of the bill' })
  @IsOptional()
  @IsEnum(BillStatus)
  status?: BillStatus;

  @ApiPropertyOptional({ type: [BillItemDto], description: 'Items included in the bill' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  items?: BillItemDto[];
}
