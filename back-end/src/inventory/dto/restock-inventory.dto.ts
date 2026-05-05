import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Restock Inventory DTO
 * Transfers inventory restocking data between client and server
 */
export class RestockInventoryDto {
  @ApiProperty({ example: 200, description: 'Quantity to add' })
  @IsInt()
  @Min(1)
  @IsNotEmpty({ message: 'Quantity is required' })
  quantity: number;

  @ApiPropertyOptional({ example: 'PharmaCorp', description: 'Supplier name' })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional({ example: 'BATCH-2026-03', description: 'Batch number' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ example: '2028-03-01T00:00:00Z', description: 'Expiry date' })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiProperty({ example: 'U002', description: 'Staff ID who restocked' })
  @IsString()
  @IsNotEmpty({ message: 'Restocked by is required' })
  restockedBy: string;

  @ApiPropertyOptional({ example: 'Received in good condition', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
