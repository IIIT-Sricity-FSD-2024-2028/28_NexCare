import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';
import { ConfirmPaymentDto, CreateIntentDto } from './dto/payment.dto';

/**
 * Payments Controller
 *
 * A patient settles their own bill; staff may take a payment at the desk. The
 * ledger — what NexCare earned — is the platform's own book and is Admin-only.
 */
@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.PATIENT)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('test-cards')
  @ApiOperation({ summary: 'Cards the simulated gateway recognises, and what each one does' })
  async testCards() {
    return this.paymentsService.testCards();
  }

  @Post('intent')
  @ApiOperation({ summary: 'Start paying a bill — the amount is taken from the bill' })
  async createIntent(@Req() req: any, @Body() body: CreateIntentDto) {
    return this.paymentsService.createIntent(body.billId, this.patientKey(req.user));
  }

  @Post(':intentId/confirm')
  @ApiOperation({ summary: 'Confirm a payment with card details (simulated)' })
  async confirmIntent(
    @Req() req: any,
    @Param('intentId') intentId: string,
    @Body() body: ConfirmPaymentDto,
  ) {
    return this.paymentsService.confirmIntent(
      intentId,
      {
        number: body.cardNumber,
        expiryMonth: body.expiryMonth,
        expiryYear: body.expiryYear,
        cvv: body.cvv,
      },
      body.idempotencyKey,
      this.patientKey(req.user),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Payment attempts (patients: own only)' })
  async findIntents(@Req() req: any) {
    return this.paymentsService.findIntents(this.patientKey(req.user));
  }

  @Roles(UserRole.SUPERUSER)
  @Get('ledger')
  @ApiOperation({ summary: 'The platform earnings ledger — every fee NexCare has taken' })
  @ApiQuery({ name: 'stream', required: false })
  @ApiQuery({ name: 'hospitalId', required: false })
  async findLedger(@Query('stream') stream?: string, @Query('hospitalId') hospitalId?: string) {
    return this.paymentsService.findLedger(stream, hospitalId);
  }

  /**
   * Bills are keyed on the patient RECORD id (P001), not the login id (U020).
   * Staff and the Admin are not pinned to a patient, so they get undefined and
   * the service skips the ownership check.
   */
  private patientKey(user: any): string | undefined {
    if (user?.role !== UserRole.PATIENT) return undefined;
    return user.patientId || user.id;
  }
}
