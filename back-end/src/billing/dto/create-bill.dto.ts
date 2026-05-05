import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BillItemDto {
  @ApiProperty({ example: 'General Consultation', description: 'Description of the item' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'General Medicine', description: 'Department responsible' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ example: 1000, description: 'Amount for the item' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}

/**
 * Create Bill DTO
 * Transfers bill creation data between client and server
 */
export class CreateBillDto {
  @ApiProperty({ example: 'P001', description: 'ID of the patient' })
  @IsString()
  @IsNotEmpty({ message: 'Patient ID is required' })
  patientId: string;

  @ApiProperty({ example: '2026-03-01T00:00:00Z', description: 'Date of visit' })
  @IsString()
  @IsNotEmpty({ message: 'Visit date is required' })
  visitDate: string;

  @ApiProperty({ example: '2026-03-15T00:00:00Z', description: 'Due date for payment' })
  @IsString()
  @IsNotEmpty({ message: 'Due date is required' })
  dueDate: string;

  @ApiProperty({ type: [BillItemDto], description: 'Items included in the bill' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  items: BillItemDto[];
}
