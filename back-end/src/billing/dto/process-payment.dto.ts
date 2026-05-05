import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Process Payment DTO
 * Transfers payment processing data between client and server
 */
export class ProcessPaymentDto {
  @ApiProperty({ example: 'CARD', description: 'Payment method' })
  @IsString()
  @IsNotEmpty({ message: 'Payment method is required' })
  method: string;

  @ApiProperty({ example: 1000, description: 'Amount paid' })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty({ message: 'Amount is required' })
  amount: number;

  @ApiPropertyOptional({ example: 'TXN-12345678', description: 'Transaction reference ID' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ example: 'U002', description: 'ID of staff who processed payment' })
  @IsOptional()
  @IsString()
  processedBy?: string;
}
