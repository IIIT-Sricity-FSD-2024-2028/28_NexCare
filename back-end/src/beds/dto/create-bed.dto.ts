import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create Bed DTO
 * Transfers bed creation data between client and server
 */
export class CreateBedDto {
  @ApiProperty({ example: 'ICU-1', description: 'Unique identifier for the bed' })
  @IsString()
  @IsNotEmpty({ message: 'Bed ID is required' })
  id: string;

  @ApiProperty({ example: 'ICU', description: 'Ward the bed belongs to' })
  @IsString()
  @IsNotEmpty({ message: 'Ward is required' })
  ward: string;
}
