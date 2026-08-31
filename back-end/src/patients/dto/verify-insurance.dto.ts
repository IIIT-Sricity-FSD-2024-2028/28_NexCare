import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Verify Insurance DTO
 *
 * The verify-insurance body was typed `any`, so Swagger showed no request
 * schema and the global ValidationPipe skipped the route entirely — anything at
 * all could be spread onto the patient's insurance record.
 *
 * Verification itself is a mock: the platform records the declared policy and
 * stamps it `mock_verified`. It does not contact an insurer.
 */
export class VerifyInsuranceDto {
  @ApiProperty({ example: 'Star Health', description: 'Insurance provider name' })
  @IsString()
  @IsNotEmpty({ message: 'Insurance provider is required' })
  provider: string;

  @ApiProperty({ example: 'SH-2026-884213', description: 'Policy number' })
  @IsString()
  @IsNotEmpty({ message: 'Policy number is required' })
  policyNumber: string;

  @ApiPropertyOptional({ example: 'Raghav Rao', description: 'Name the policy is held in' })
  @IsOptional()
  @IsString()
  policyHolderName?: string;

  @ApiPropertyOptional({ example: '2027-03-31', description: 'Policy validity end date (ISO)' })
  @IsOptional()
  @IsString()
  validTill?: string;

  @ApiPropertyOptional({ example: '500000', description: 'Declared sum insured' })
  @IsOptional()
  @IsString()
  sumInsured?: string;
}
