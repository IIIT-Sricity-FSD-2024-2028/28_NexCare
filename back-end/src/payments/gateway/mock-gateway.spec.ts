import { MockPaymentGateway } from './mock-gateway';

/**
 * The gateway is a simulation, so its whole value is that every outcome is
 * reachable on demand. These tests are the proof of that: if a path cannot be
 * triggered from a test, it cannot be demonstrated either.
 */
describe('MockPaymentGateway', () => {
  const gateway = new MockPaymentGateway();
  const goodCard = { expiryMonth: 12, expiryYear: 2035, cvv: '123' };

  describe('approval', () => {
    it('approves the designated success card', () => {
      const result = gateway.authorise({ number: '4242424242424242', ...goodCard });
      expect(result.approved).toBe(true);
      expect(result.code).toBe('approved');
      expect(result.reference).toMatch(/^MOCK-[0-9A-F]+$/);
    });

    it('never returns the full card number, only the last four', () => {
      const result = gateway.authorise({ number: '4242424242424242', ...goodCard });
      expect(result.last4).toBe('4242');
      expect(JSON.stringify(result)).not.toContain('4242424242424242');
    });

    it('identifies the card brand', () => {
      expect(gateway.authorise({ number: '4242424242424242', ...goodCard }).cardBrand).toBe('Visa');
      expect(gateway.authorise({ number: '5555555555554444', ...goodCard }).cardBrand).toBe('Mastercard');
    });
  });

  describe('declines — each must be reproducible on demand', () => {
    it.each([
      ['4000000000000002', 'card_declined'],
      ['4000000000000069', 'expired_card'],
      ['4000000000000119', 'processing_error'],
      ['4000000000009995', 'insufficient_funds'],
    ])('declines %s with %s', (number, code) => {
      const result = gateway.authorise({ number, ...goodCard });
      expect(result.approved).toBe(false);
      expect(result.code).toBe(code);
    });
  });

  describe('validation happens before the processor is reached', () => {
    it('rejects a number that fails the Luhn checksum', () => {
      const result = gateway.authorise({ number: '4242424242424243', ...goodCard });
      expect(result.approved).toBe(false);
      expect(result.code).toBe('invalid_number');
    });

    it('rejects a malformed CVV', () => {
      const result = gateway.authorise({ number: '4242424242424242', expiryMonth: 12, expiryYear: 2035, cvv: '1' });
      expect(result.approved).toBe(false);
      expect(result.code).toBe('invalid_cvv');
    });

    it('rejects a card whose expiry has passed', () => {
      const result = gateway.authorise({ number: '4242424242424242', expiryMonth: 1, expiryYear: 2020, cvv: '123' });
      expect(result.approved).toBe(false);
      expect(result.code).toBe('expired_card');
    });

    it('treats the expiry month itself as still valid', () => {
      const now = new Date();
      const result = gateway.authorise({
        number: '4242424242424242',
        expiryMonth: now.getMonth() + 1,
        expiryYear: now.getFullYear(),
        cvv: '123',
      });
      expect(result.approved).toBe(true);
    });
  });

  it('declines an unknown card rather than approving it', () => {
    // Approving anything well-formed would let a demo "succeed" on a number
    // nobody chose, hiding the fact that this is a simulation.
    const result = gateway.authorise({ number: '4111111111111111', ...goodCard });
    expect(result.approved).toBe(false);
    expect(result.code).toBe('card_not_supported');
  });

  it('is deterministic — the same card always gives the same answer', () => {
    const a = gateway.authorise({ number: '4000000000000002', ...goodCard });
    const b = gateway.authorise({ number: '4000000000000002', ...goodCard });
    expect(a.code).toBe(b.code);
    expect(a.approved).toBe(b.approved);
  });

  it('publishes its test cards so the UI can list them', () => {
    const cards = MockPaymentGateway.testCards();
    expect(cards.length).toBeGreaterThanOrEqual(5);
    expect(cards.filter(c => c.approves)).toHaveLength(1);
  });
});
