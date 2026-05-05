import { InventoryStatus } from '../../common/interfaces/api-response.interface';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update Inventory DTO
 * Transfers inventory item update data between client and server
 */
export class UpdateInventoryDto {
  @ApiPropertyOptional({ example: 'Paracetamol', description: 'Name of the item' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Medication', description: 'Category of the item' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 500, description: 'Current quantity' })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ example: 100, description: 'Minimum stock threshold' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ example: 'tablets', description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 'Pharmacy', description: 'Location of the item' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: InventoryStatus, example: InventoryStatus.IN_STOCK, description: 'Status of the item' })
  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;
}
