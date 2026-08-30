import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIntentDto {
  @ApiProperty({ example: 'BILL-002', description: 'The bill being settled' })
  @IsString()
  @IsNotEmpty({ message: 'Bill ID is required' })
  billId: string;
}

/**
 * Card details for the SIMULATED gateway. Nothing here is stored beyond the
 * last four digits, and no real card is ever contacted.
 */
export class ConfirmPaymentDto {
  @ApiProperty({ example: '4242424242424242', description: 'Test card number' })
  @IsString()
  @Matches(/^[\d\s-]{13,25}$/, { message: 'Card number must be 13 to 19 digits' })
  cardNumber: string;

  @ApiProperty({ example: 12, description: 'Expiry month, 1-12' })
  @IsInt({ message: 'Expiry month must be a whole number' })
  @Min(1, { message: 'Expiry month must be between 1 and 12' })
  @Max(12, { message: 'Expiry month must be between 1 and 12' })
  expiryMonth: number;

  @ApiProperty({ example: 2030, description: 'Expiry year' })
  @IsInt({ message: 'Expiry year must be a whole number' })
  @Min(2000, { message: 'Enter a four-digit expiry year' })
  @Max(2100, { message: 'Enter a four-digit expiry year' })
  expiryYear: number;

  @ApiProperty({ example: '123', description: 'CVV' })
  @IsString()
  @Matches(/^\d{3,4}$/, { message: 'CVV must be 3 or 4 digits' })
  cvv: string;

  @ApiPropertyOptional({
    example: 'bill-002-attempt-1',
    description: 'Replaying this key returns the original outcome instead of charging again',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
