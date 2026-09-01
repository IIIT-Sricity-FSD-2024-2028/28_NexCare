import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PaymentsService } from './payments.service';
import { PricingService } from '../revenue/pricing.service';

/**
 * These run against a throwaway data directory.
 *
 * FileStore resolves its path from process.cwd() AT CONSTRUCTION TIME, so the
 * cwd has to be redirected before the services are built — hence the ordering
 * in beforeEach. Getting that backwards silently writes to the real seed data.
 */
describe('PaymentsService', () => {
  let dir: string;
  let service: PaymentsService;

  const SUCCESS_CARD = { number: '4242424242424242', expiryMonth: 12, expiryYear: 2035, cvv: '123' };
  const DECLINED_CARD = { number: '4000000000000002', expiryMonth: 12, expiryYear: 2035, cvv: '123' };

  const BILL = {
    id: 'BILL-TEST-1',
    patientId: 'P001',
    hospitalId: 'H001',
    status: 'Pending',
    currency: '₹',
    total: 10000,
    items: [],
    payments: [],
    createdAt: '2026-08-01T00:00:00.000Z',
  };

  const readJson = (file: string) =>
    JSON.parse(fs.readFileSync(path.join(dir, 'data', file), 'utf-8'));

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexcare-pay-'));
    fs.mkdirSync(path.join(dir, 'data'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'data', 'billing.json'), JSON.stringify([{ ...BILL }]));
    fs.writeFileSync(
      path.join(dir, 'data', 'platform-fee-config.json'),
      JSON.stringify([{
        id: 'FEE-CONFIG', currency: '₹',
        patientBookingFee: 39,
        ambulanceDispatchFee: 149,
        paymentGatewayRate: 0.019,
        extraStaffSeatFee: 250,
        notificationCreditFee: 0.35,
        updatedAt: new Date().toISOString(),
      }]),
    );

    jest.spyOn(process, 'cwd').mockReturnValue(dir);
    service = new PaymentsService(new PricingService());
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const startAndConfirm = async (card: any, idempotencyKey?: string) => {
    const intentRes: any = await service.createIntent('BILL-TEST-1', 'P001');
    return service.confirmIntent(intentRes.data.id, card, idempotencyKey, 'P001');
  };

  describe('a successful payment', () => {
    it('settles the bill and records the processing fee', async () => {
      const res: any = await startAndConfirm(SUCCESS_CARD);

      expect(res.success).toBe(true);
      expect(res.data.intent.status).toBe('succeeded');
      expect(readJson('billing.json')[0].status).toBe('Paid');

      const ledger = readJson('platform-transactions.json');
      // The commission on collections went with the 2026-09-01 model change,
      // so processing is the only fee a settled bill now earns.
      expect(ledger).toHaveLength(1);
      expect(ledger[0].stream).toBe('payment_gateway_fee');
      expect(ledger[0].amount).toBe(190);   // 1.9% of ₹10,000
    });

    it('stores the rate on the row, so repricing cannot restate history', async () => {
      await startAndConfirm(SUCCESS_CARD);
      const ledger = readJson('platform-transactions.json');
      expect(ledger.every((r: any) => typeof r.rate === 'number')).toBe(true);
      expect(ledger.every((r: any) => r.origin === 'gateway')).toBe(true);
    });

    it('never writes a full card number to disk', async () => {
      await startAndConfirm(SUCCESS_CARD);
      const raw = fs.readFileSync(path.join(dir, 'data', 'payment-intents.json'), 'utf-8');
      expect(raw).not.toContain('4242424242424242');
      expect(JSON.parse(raw)[0].cardLast4).toBe('4242');
    });
  });

  describe('a declined payment', () => {
    it('leaves the bill outstanding and earns the platform nothing', async () => {
      const res: any = await startAndConfirm(DECLINED_CARD);

      expect(res.success).toBe(false);
      expect(readJson('billing.json')[0].status).toBe('Pending');

      // The ledger file may not even exist yet — either way, no fee was earned.
      const ledgerPath = path.join(dir, 'data', 'platform-transactions.json');
      const ledger = fs.existsSync(ledgerPath) ? readJson('platform-transactions.json') : [];
      expect(ledger).toHaveLength(0);
    });
  });

  describe('idempotency', () => {
    it('does not charge twice when a double-clicked Pay replays the same key', async () => {
      // The real scenario is ONE intent confirmed twice, not two intents — a
      // second intent for a settled bill is refused outright (see guards).
      const intentRes: any = await service.createIntent('BILL-TEST-1', 'P001');
      const intentId = intentRes.data.id;

      const first: any = await service.confirmIntent(intentId, SUCCESS_CARD, 'attempt-1', 'P001');
      const second: any = await service.confirmIntent(intentId, SUCCESS_CARD, 'attempt-1', 'P001');

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      expect(second.message).toMatch(/idempotent/i);

      // One payment on the bill, one fee row in the ledger.
      expect(readJson('billing.json')[0].payments).toHaveLength(1);
      expect(readJson('platform-transactions.json')).toHaveLength(1);
    });

    it('refuses a second confirmation without an idempotency key', async () => {
      const intentRes: any = await service.createIntent('BILL-TEST-1', 'P001');
      await service.confirmIntent(intentRes.data.id, SUCCESS_CARD, undefined, 'P001');
      const second: any = await service.confirmIntent(intentRes.data.id, SUCCESS_CARD, undefined, 'P001');

      expect(second.success).toBe(false);
      expect(second.message).toMatch(/already succeeded/i);
      expect(readJson('platform-transactions.json')).toHaveLength(1);
    });
  });

  describe('guards', () => {
    it('refuses to start a payment for someone else’s bill', async () => {
      const res: any = await service.createIntent('BILL-TEST-1', 'P999');
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/your own bills/i);
    });

    it('refuses to pay a bill that is already settled', async () => {
      await startAndConfirm(SUCCESS_CARD);
      const res: any = await service.createIntent('BILL-TEST-1', 'P001');
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/already been paid/i);
    });

    it('takes the amount from the bill, not from the caller', async () => {
      const intentRes: any = await service.createIntent('BILL-TEST-1', 'P001');
      expect(intentRes.data.amount).toBe(10000);
    });
  });
});
