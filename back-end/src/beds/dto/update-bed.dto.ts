import { BedStatus } from '../../common/interfaces/api-response.interface';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update Bed DTO
 * Transfers bed update data between client and server
 */
export class UpdateBedDto {
  @ApiPropertyOptional({ example: 'ICU', description: 'Ward the bed belongs to' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({ enum: BedStatus, example: BedStatus.OCCUPIED, description: 'Status of the bed' })
  @IsOptional()
  @IsEnum(BedStatus)
  status?: BedStatus;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Patient name' })
  @IsOptional()
  @IsString()
  patient?: string;
}
