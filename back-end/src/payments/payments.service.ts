import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { FileStore } from '../common/utils/file-store.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { PricingService } from '../revenue/pricing.service';
import { MockPaymentGateway } from './gateway/mock-gateway';
import {
  PaymentIntent,
  PlatformTransaction,
} from './interfaces/payment.interface';

/**
 * Payments Service
 *
 * Settles a hospital's bill through the simulated gateway and, when it
 * succeeds, writes the fees NexCare earned into the platform ledger.
 *
 * The ordering matters and is deliberate: the bill is only marked Paid, and the
 * ledger is only written, AFTER the gateway approves. A declined payment leaves
 * the bill outstanding and earns the platform nothing — which is exactly what
 * the tests assert.
 */
@Injectable()
export class PaymentsService {
  private readonly intentsStore = new FileStore<PaymentIntent>('payment-intents.json', () => []);
  private readonly ledgerStore = new FileStore<PlatformTransaction>('platform-transactions.json', () => []);
  private readonly billsStore = new FileStore<any>('billing.json', () => []);

  private readonly gateway = new MockPaymentGateway();

  constructor(private readonly pricing: PricingService) {}

  /** The cards this simulation recognises, so the UI can list them. */
  async testCards() {
    return ResponseUtil.success('Test cards retrieved successfully', {
      note: 'Simulated gateway. No real card is accepted, contacted or stored.',
      cards: MockPaymentGateway.testCards(),
    });
  }

  // ── Intents ───────────────────────────────────────────────────────────────

  /**
   * Start paying a bill. The amount comes from the bill, never from the
   * client — otherwise a patient could settle a ₹50,000 bill by posting ₹1.
   */
  async createIntent(billId: string, patientKey: string) {
    try {
      const bill = this.billsStore.load().find(b => b.id === billId);
      if (!bill) return ResponseUtil.notFound('Bill', billId);
      if (String(bill.status).toLowerCase() === 'paid') {
        return ResponseUtil.error('This bill has already been paid');
      }
      if (patientKey && bill.patientId !== patientKey) {
        return ResponseUtil.forbidden('You can only pay your own bills');
      }

      const intent: PaymentIntent = {
        id: `PI-${IdGenerator.generateUserId()}`,
        billId: bill.id,
        patientId: bill.patientId,
        hospitalId: bill.hospitalId || '',
        amount: bill.total,
        currency: bill.currency || '₹',
        status: 'requires_confirmation',
        createdAt: new Date().toISOString(),
      };

      const intents = this.intentsStore.load();
      intents.push(intent);
      this.intentsStore.save(intents);

      return ResponseUtil.created('Payment intent', intent);
    } catch (error) {
      console.error('Create intent error:', error);
      return ResponseUtil.serverError('Failed to start the payment');
    }
  }

  /**
   * Confirm an intent with card details.
   *
   * `idempotencyKey` makes a repeat of the same request return the original
   * outcome rather than charging again — a double-clicked Pay button is the
   * normal way a patient gets billed twice.
   */
  async confirmIntent(
    intentId: string,
    card: { number: string; expiryMonth: number; expiryYear: number; cvv: string },
    idempotencyKey?: string,
    patientKey?: string,
  ) {
    try {
      const intents = this.intentsStore.load();

      if (idempotencyKey) {
        const replay = intents.find(
          i => i.idempotencyKey === idempotencyKey && i.status !== 'requires_confirmation',
        );
        if (replay) {
          return ResponseUtil.success('Payment already processed (idempotent replay)', replay);
        }
      }

      const idx = intents.findIndex(i => i.id === intentId);
      if (idx === -1) return ResponseUtil.notFound('Payment intent', intentId);

      const intent = intents[idx];
      if (patientKey && intent.patientId !== patientKey) {
        return ResponseUtil.forbidden('You can only pay your own bills');
      }
      if (intent.status !== 'requires_confirmation') {
        return ResponseUtil.error(`This payment is already ${intent.status}`);
      }

      const result = this.gateway.authorise(card);

      intent.gatewayReference = result.reference;
      intent.cardBrand = result.cardBrand;
      intent.cardLast4 = result.last4;
      intent.idempotencyKey = idempotencyKey;
      intent.confirmedAt = new Date().toISOString();

      if (!result.approved) {
        intent.status = result.code === 'processing_error' ? 'failed' : 'declined';
        intent.failureCode = result.code;
        intent.failureMessage = result.message;
        intents[idx] = intent;
        this.intentsStore.save(intents);
        // A declined payment earns the platform nothing and leaves the bill open.
        return ResponseUtil.error(result.message, intent);
      }

      intent.status = 'succeeded';
      intents[idx] = intent;
      this.intentsStore.save(intents);

      this.markBillPaid(intent);
      const fees = this.recordFeesForBill(intent);

      return ResponseUtil.success('Payment approved', { intent, platformFees: fees });
    } catch (error) {
      console.error('Confirm intent error:', error);
      return ResponseUtil.serverError('Failed to process the payment');
    }
  }

  // ── Bill settlement ───────────────────────────────────────────────────────

  private markBillPaid(intent: PaymentIntent): void {
    const bills = this.billsStore.load();
    const idx = bills.findIndex(b => b.id === intent.billId);
    if (idx === -1) return;

    bills[idx].status = 'Paid';
    bills[idx].payments = bills[idx].payments || [];
    bills[idx].payments.push({
      id: `PAY-${intent.id}`,
      amount: intent.amount,
      method: `CARD (${intent.cardBrand} ••••${intent.cardLast4})`,
      gatewayReference: intent.gatewayReference,
      createdAt: intent.confirmedAt,
    });
    this.billsStore.save(bills);
  }

  // ── The platform ledger ───────────────────────────────────────────────────

  /**
   * Record what NexCare earned from one settled bill: the processing fee on the
   * transaction, and the commission on what the hospital collected.
   *
   * Rates are read once, here, and stored on the row. Repricing later changes
   * what the NEXT payment earns, not what this one did.
   */
  private recordFeesForBill(intent: PaymentIntent): PlatformTransaction[] {
    const fees = this.pricing.loadFeeConfig();
    const at = intent.confirmedAt || new Date().toISOString();

    const rows: PlatformTransaction[] = [
      this.feeRow({
        stream: 'payment_gateway_fee',
        sourceId: intent.billId,
        hospitalId: intent.hospitalId,
        patientId: intent.patientId,
        gross: intent.amount,
        rate: fees.paymentGatewayRate,
        amount: intent.amount * fees.paymentGatewayRate,
        at,
        origin: 'gateway',
      }),
      this.feeRow({
        stream: 'hospital_commission',
        sourceId: intent.billId,
        hospitalId: intent.hospitalId,
        patientId: intent.patientId,
        gross: intent.amount,
        rate: fees.hospitalCommissionRate,
        amount: intent.amount * fees.hospitalCommissionRate,
        at,
        origin: 'gateway',
      }),
    ];

    const ledger = this.ledgerStore.load();
    // Never double-charge a bill, however the confirm route was reached.
    const already = new Set(
      ledger.filter(r => r.sourceId === intent.billId).map(r => r.stream),
    );
    const fresh = rows.filter(r => !already.has(r.stream));
    if (fresh.length) {
      this.ledgerStore.save(ledger.concat(fresh));
    }
    return fresh;
  }

  private feeRow(input: {
    stream: PlatformTransaction['stream'];
    sourceId: string;
    hospitalId?: string;
    patientId?: string;
    doctorId?: string;
    gross: number;
    rate: number | null;
    amount: number;
    at: string;
    origin: PlatformTransaction['origin'];
  }): PlatformTransaction {
    return {
      id: `TXN-${IdGenerator.generateUserId()}`,
      stream: input.stream,
      sourceType: input.stream === 'doctor_commission' ? 'appointment' : 'bill',
      sourceId: input.sourceId,
      hospitalId: input.hospitalId,
      patientId: input.patientId,
      doctorId: input.doctorId,
      gross: this.round(input.gross),
      rate: input.rate,
      amount: this.round(input.amount),
      currency: '₹',
      createdAt: input.at,
      origin: input.origin,
    };
  }

  // ── Reads ─────────────────────────────────────────────────────────────────

  async findIntents(patientKey?: string) {
    try {
      const intents = this.intentsStore.load();
      const mine = patientKey ? intents.filter(i => i.patientId === patientKey) : intents;
      mine.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      return ResponseUtil.success('Payments retrieved successfully', mine);
    } catch {
      return ResponseUtil.serverError('Failed to retrieve payments');
    }
  }

  /** The platform earnings ledger — every fee NexCare has taken. */
  async findLedger(stream?: string, hospitalId?: string) {
    try {
      let rows = this.ledgerStore.load();
      if (stream) rows = rows.filter(r => r.stream === stream);
      if (hospitalId) rows = rows.filter(r => r.hospitalId === hospitalId);
      rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

      const total = rows.reduce((t, r) => t + r.amount, 0);
      return ResponseUtil.success('Platform ledger retrieved successfully', {
        currency: '₹',
        entries: rows.length,
        total: this.round(total),
        rows,
      });
    } catch {
      return ResponseUtil.serverError('Failed to retrieve the platform ledger');
    }
  }

  private round(value: number): number {
    return Math.round(((value || 0) + Number.EPSILON) * 100) / 100;
  }
}
