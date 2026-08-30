import * as crypto from 'crypto';
import { GatewayResult } from '../interfaces/payment.interface';

/**
 * Mock payment gateway — a SIMULATION. No money moves and no real card is ever
 * accepted, contacted or stored.
 *
 * It behaves like a processor's test mode (Stripe, Razorpay): the outcome is
 * chosen by the card number, so every path can be demonstrated on demand rather
 * than waited for. That is the whole point — a decline you cannot reproduce is
 * a decline you cannot test.
 *
 * Only the last four digits ever leave this class.
 */
export class MockPaymentGateway {
  /** Card numbers with a fixed, documented outcome. */
  private static readonly TEST_CARDS: Record<string, { code: string; message: string }> = {
    '4242424242424242': { code: 'approved', message: 'Payment approved' },
    '4000000000000002': { code: 'card_declined', message: 'Card declined by the issuing bank' },
    '4000000000000069': { code: 'expired_card', message: 'Card has expired' },
    '4000000000000119': { code: 'processing_error', message: 'Processor error, please retry' },
    '4000000000009995': { code: 'insufficient_funds', message: 'Insufficient funds' },
  };

  /** Every card this simulation accepts, for the UI to display. */
  static testCards() {
    return Object.entries(MockPaymentGateway.TEST_CARDS).map(([number, outcome]) => ({
      number,
      outcome: outcome.code,
      message: outcome.message,
      approves: outcome.code === 'approved',
    }));
  }

  /**
   * Authorise an amount. Deterministic: the same card always gives the same
   * answer, so a demo and a test agree.
   */
  authorise(card: { number: string; expiryMonth: number; expiryYear: number; cvv: string }): GatewayResult {
    const digits = String(card.number || '').replace(/\D/g, '');
    const last4 = digits.slice(-4);
    const brand = this.brandOf(digits);
    const reference = `MOCK-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    // Shape checks first — a malformed card never reaches the "processor".
    if (digits.length < 13 || digits.length > 19) {
      return this.reject(reference, 'invalid_number', 'Card number must be 13 to 19 digits', brand, last4);
    }
    if (!this.passesLuhn(digits)) {
      return this.reject(reference, 'invalid_number', 'Card number failed the checksum', brand, last4);
    }
    if (!/^\d{3,4}$/.test(String(card.cvv || ''))) {
      return this.reject(reference, 'invalid_cvv', 'CVV must be 3 or 4 digits', brand, last4);
    }
    if (this.isExpired(card.expiryMonth, card.expiryYear)) {
      return this.reject(reference, 'expired_card', 'Card has expired', brand, last4);
    }

    const scripted = MockPaymentGateway.TEST_CARDS[digits];
    if (scripted) {
      return scripted.code === 'approved'
        ? { approved: true, reference, code: 'approved', message: scripted.message, cardBrand: brand, last4 }
        : this.reject(reference, scripted.code, scripted.message, brand, last4);
    }

    // Any other well-formed card is declined rather than approved. Approving
    // unknown cards would let a demo "succeed" with a number nobody chose,
    // which hides the fact that this is a simulation.
    return this.reject(
      reference,
      'card_not_supported',
      'Unrecognised test card. Use 4242 4242 4242 4242 to approve.',
      brand,
      last4,
    );
  }

  private reject(reference: string, code: string, message: string, cardBrand: string, last4: string): GatewayResult {
    return { approved: false, reference, code, message, cardBrand, last4 };
  }

  /** The standard card checksum — real processors reject a typo before charging. */
  private passesLuhn(digits: string): boolean {
    let sum = 0;
    let double = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = digits.charCodeAt(i) - 48;
      if (double) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      double = !double;
    }
    return sum % 10 === 0;
  }

  private isExpired(month: number, year: number): boolean {
    if (!month || !year || month < 1 || month > 12) return true;
    const now = new Date();
    const fullYear = year < 100 ? 2000 + year : year;
    // A card is good through the last day of its expiry month.
    return fullYear < now.getFullYear() ||
      (fullYear === now.getFullYear() && month < now.getMonth() + 1);
  }

  private brandOf(digits: string): string {
    if (/^4/.test(digits)) return 'Visa';
    if (/^5[1-5]/.test(digits)) return 'Mastercard';
    if (/^3[47]/.test(digits)) return 'Amex';
    if (/^6/.test(digits)) return 'RuPay';
    return 'Unknown';
  }
}
