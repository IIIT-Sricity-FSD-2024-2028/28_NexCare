import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create Inventory DTO
 * Transfers inventory item creation data between client and server
 */
export class CreateInventoryDto {
  @ApiProperty({ example: 'Paracetamol', description: 'Name of the item' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ example: 'Medication', description: 'Category of the item' })
  @IsString()
  @IsNotEmpty({ message: 'Category is required' })
  category: string;

  @ApiProperty({ example: 500, description: 'Initial quantity' })
  @IsInt()
  @Min(0)
  @IsNotEmpty({ message: 'Quantity is required' })
  quantity: number;

  @ApiProperty({ example: 100, description: 'Minimum stock threshold' })
  @IsInt()
  @Min(0)
  @IsNotEmpty({ message: 'Minimum stock is required' })
  minStock: number;

  @ApiProperty({ example: 'tablets', description: 'Unit of measurement' })
  @IsString()
  @IsNotEmpty({ message: 'Unit is required' })
  unit: string;

  @ApiProperty({ example: 'Pharmacy', description: 'Location of the item' })
  @IsString()
  @IsNotEmpty({ message: 'Location is required' })
  location: string;
}
