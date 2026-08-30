import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { RevenueService } from './revenue.service';
import { PricingService } from './pricing.service';
import { PaymentsService } from '../payments/payments.service';

/**
 * Revenue had no test coverage at all until the subscription model was removed.
 * Now that every rupee is transactional, these fix the arithmetic to exact
 * figures — a mistyped rate shows up here rather than in a demo.
 *
 * As in the payments spec, cwd is redirected before the services are built,
 * because FileStore resolves its path at construction time.
 */
describe('RevenueService', () => {
  let dir: string;
  let revenue: RevenueService;
  let payments: PaymentsService;

  const write = (file: string, data: any) =>
    fs.writeFileSync(path.join(dir, 'data', file), JSON.stringify(data));

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexcare-rev-'));
    fs.mkdirSync(path.join(dir, 'data'), { recursive: true });

    write('platform-fee-config.json', [{
      id: 'FEE-CONFIG', currency: '₹',
      patientBookingFee: 40,
      hospitalCommissionRate: 0.02,
      ambulanceDispatchFee: 100,
      paymentGatewayRate: 0.01,
      extraStaffSeatFee: 250,
      notificationCreditFee: 0.35,
      updatedAt: new Date().toISOString(),
    }]);
    write('hospitals.json', [{ id: 'H001', name: 'Test Hospital', city: 'Tirupati', verificationStatus: 'verified' }]);
    write('users.json', [
      { id: 'D1', name: 'Dr. One', email: 'd1@x.com', role: 'doctor', hospitalId: 'H001', dept: 'Cardiology', status: 'Active' },
      { id: 'U1', name: 'Pat', email: 'p@x.com', role: 'patient' },
    ]);
    write('doctor-subscriptions.json', [{
      id: 'DSUB-D1', doctorId: 'D1', doctorName: 'Dr. One', hospitalId: 'H001',
      planId: 'DOC-FREE', status: 'active', consultationFee: 1000,
      startedAt: '2026-01-01T00:00:00.000Z', renewsOn: '2026-09-01T00:00:00.000Z',
    }]);
    write('patient-subscriptions.json', []);
    write('appointments.json', []);
    write('ambulance.json', []);
    write('beds.json', []);
    write('billing.json', []);
    write('platform-transactions.json', []);

    jest.spyOn(process, 'cwd').mockReturnValue(dir);
    const pricing = new PricingService();
    revenue = new RevenueService(pricing);
    payments = new PaymentsService(pricing);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const streamNamed = (data: any, key: string) =>
    data.byStream.find((s: any) => s.key === key);

  it('no longer reports a hospital subscription stream', async () => {
    const res: any = await revenue.getPlatformStreams();
    expect(res.success).toBe(true);
    expect(streamNamed(res.data, 'hospital_subscription')).toBeUndefined();
    expect(res.data.byStream.map((s: any) => s.key)).toEqual(
      expect.arrayContaining(['hospital_commission', 'payment_gateway_fee', 'doctor_commission']),
    );
  });

  it('earns nothing from a hospital that has collected nothing', async () => {
    const res: any = await revenue.getPlatformStreams();
    expect(streamNamed(res.data, 'hospital_commission').amount).toBe(0);
    expect(streamNamed(res.data, 'payment_gateway_fee').amount).toBe(0);
  });

  it('reads hospital fees from the ledger, at the rate recorded on the row', async () => {
    // Deliberately NOT the current 2% / 1% — a historical row must keep its
    // own rate, so that repricing today cannot restate what was earned then.
    write('platform-transactions.json', [
      { id: 'T1', stream: 'hospital_commission', sourceType: 'bill', sourceId: 'B1', hospitalId: 'H001',
        gross: 10000, rate: 0.015, amount: 150, currency: '₹', createdAt: '2026-08-01T00:00:00.000Z', origin: 'gateway' },
      { id: 'T2', stream: 'payment_gateway_fee', sourceType: 'bill', sourceId: 'B1', hospitalId: 'H001',
        gross: 10000, rate: 0.019, amount: 190, currency: '₹', createdAt: '2026-08-01T00:00:00.000Z', origin: 'gateway' },
    ]);

    const res: any = await revenue.getPlatformStreams();
    expect(streamNamed(res.data, 'hospital_commission').amount).toBe(150);
    expect(streamNamed(res.data, 'payment_gateway_fee').amount).toBe(190);
  });

  it('charges the booking fee per non-cancelled appointment', async () => {
    write('appointments.json', [
      { id: 'A1', patientId: 'P1', doctorId: 'D1', doctor: 'Dr. One', fee: 1000, status: 'Completed', createdAt: '2026-08-01T00:00:00.000Z', hospitalId: 'H001' },
      { id: 'A2', patientId: 'P1', doctorId: 'D1', doctor: 'Dr. One', fee: 1000, status: 'Confirmed', createdAt: '2026-08-02T00:00:00.000Z', hospitalId: 'H001' },
      { id: 'A3', patientId: 'P1', doctorId: 'D1', doctor: 'Dr. One', fee: 1000, status: 'Cancelled', createdAt: '2026-08-03T00:00:00.000Z', hospitalId: 'H001' },
    ]);

    const res: any = await revenue.getPlatformStreams();
    const booking = streamNamed(res.data, 'patient_booking_fee');
    expect(booking.units).toBe(2);          // the cancelled one is not charged
    expect(booking.amount).toBe(80);        // 2 x ₹40
  });

  it('takes doctor commission only on a COMPLETED consultation', async () => {
    write('appointments.json', [
      { id: 'A1', patientId: 'P1', doctorId: 'D1', doctor: 'Dr. One', fee: 1000, status: 'Completed', createdAt: '2026-08-01T00:00:00.000Z', hospitalId: 'H001' },
      { id: 'A2', patientId: 'P1', doctorId: 'D1', doctor: 'Dr. One', fee: 1000, status: 'Confirmed', createdAt: '2026-08-02T00:00:00.000Z', hospitalId: 'H001' },
    ]);

    const res: any = await revenue.getPlatformStreams();
    // Free tier takes 12% of one completed ₹1,000 consultation.
    expect(streamNamed(res.data, 'doctor_commission').amount).toBe(120);
    expect(streamNamed(res.data, 'doctor_commission').units).toBe(1);
  });

  it('waives the booking fee for a Care+ member', async () => {
    write('patient-subscriptions.json', [{
      id: 'PSUB-P1', patientId: 'P1', patientName: 'Pat', planId: 'CARE-PLUS',
      status: 'active', startedAt: '2026-08-01T00:00:00.000Z', renewsOn: '2026-09-01T00:00:00.000Z',
    }]);
    write('appointments.json', [
      { id: 'A1', patientId: 'P1', doctorId: 'D1', doctor: 'Dr. One', fee: 1000, status: 'Completed', createdAt: '2026-08-01T00:00:00.000Z', hospitalId: 'H001' },
    ]);

    const res: any = await revenue.getPlatformStreams();
    expect(streamNamed(res.data, 'patient_booking_fee').amount).toBe(0);
    expect(streamNamed(res.data, 'patient_membership').amount).toBe(199);
  });

  it('adds every stream up to the reported total', async () => {
    const res: any = await revenue.getPlatformStreams();
    const summed = res.data.byStream.reduce((t: number, s: any) => t + s.amount, 0);
    expect(Math.round(summed * 100) / 100).toBe(res.data.totalRevenue);
  });

  describe('end to end: a paid bill moves the dashboard', () => {
    it('turns one card payment into exactly the right platform revenue', async () => {
      write('billing.json', [{
        id: 'BILL-1', patientId: 'P1', hospitalId: 'H001', status: 'Pending',
        currency: '₹', total: 20000, items: [], payments: [], createdAt: '2026-08-10T00:00:00.000Z',
      }]);

      const before: any = await revenue.getPlatformStreams();
      expect(streamNamed(before.data, 'hospital_commission').amount).toBe(0);

      const intent: any = await payments.createIntent('BILL-1', 'P1');
      const paid: any = await payments.confirmIntent(
        intent.data.id,
        { number: '4242424242424242', expiryMonth: 12, expiryYear: 2035, cvv: '123' },
        'e2e-1', 'P1',
      );
      expect(paid.success).toBe(true);

      const after: any = await revenue.getPlatformStreams();
      // ₹20,000 at 2% commission and 1% processing.
      expect(streamNamed(after.data, 'hospital_commission').amount).toBe(400);
      expect(streamNamed(after.data, 'payment_gateway_fee').amount).toBe(200);
      expect(after.data.totalRevenue - before.data.totalRevenue).toBe(600);
    });

    it('a declined payment moves nothing', async () => {
      write('billing.json', [{
        id: 'BILL-1', patientId: 'P1', hospitalId: 'H001', status: 'Pending',
        currency: '₹', total: 20000, items: [], payments: [], createdAt: '2026-08-10T00:00:00.000Z',
      }]);

      const before: any = await revenue.getPlatformStreams();
      const intent: any = await payments.createIntent('BILL-1', 'P1');
      await payments.confirmIntent(
        intent.data.id,
        { number: '4000000000000002', expiryMonth: 12, expiryYear: 2035, cvv: '123' },
        'e2e-2', 'P1',
      );

      const after: any = await revenue.getPlatformStreams();
      expect(after.data.totalRevenue).toBe(before.data.totalRevenue);
    });
  });
});
