import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { RevenueService } from './revenue.service';
import { PricingService } from './pricing.service';
import { PaymentsService } from '../payments/payments.service';

/**
 * These fix the arithmetic of the revenue model to exact figures — a mistyped
 * rate or a plan priced off the wrong meter shows up here rather than in a
 * demo.
 *
 * The model these cover is the one settled on 2026-09-01: a hospital pays a
 * subscription priced by staff headcount, a patient pays for Care+ and per
 * booking, and the only transaction fee left is processing a bill payment.
 * There is no commission on hospital collections and nothing is charged to a
 * doctor.
 *
 * As in the payments spec, cwd is redirected before the services are built,
 * because FileStore resolves its path at construction time.
 */
describe('RevenueService', () => {
  let dir: string;
  let revenue: RevenueService;
  let pricing: PricingService;
  let payments: PaymentsService;

  const write = (file: string, data: any) =>
    fs.writeFileSync(path.join(dir, 'data', file), JSON.stringify(data));

  /** One hospital with three billable staff, plus a patient who holds no seat. */
  const staff = [
    { id: 'D1', name: 'Dr. One', email: 'd1@x.com', role: 'doctor', hospitalId: 'H001', dept: 'Cardiology', status: 'Active', consultationFee: 1000 },
    { id: 'A1', name: 'Front Desk', email: 'a1@x.com', role: 'administrative_staff', hospitalId: 'H001', status: 'Active' },
    { id: 'N1', name: 'Nurse One', email: 'n1@x.com', role: 'nurse', hospitalId: 'H001', status: 'Active' },
    { id: 'U1', name: 'Pat', email: 'p@x.com', role: 'patient' },
  ];

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexcare-rev-'));
    fs.mkdirSync(path.join(dir, 'data'), { recursive: true });

    write('platform-fee-config.json', [{
      id: 'FEE-CONFIG', currency: '₹',
      patientBookingFee: 40,
      ambulanceDispatchFee: 100,
      paymentGatewayRate: 0.01,
      extraStaffSeatFee: 250,
      notificationCreditFee: 0.35,
      updatedAt: new Date().toISOString(),
    }]);
    // One Starter plan priced at ₹5,000 covering 2 seats, so the overage
    // arithmetic has something to bite on.
    write('hospital-plans.json', [{
      id: 'HOSP-STARTER', name: 'Starter', tagline: 'test',
      minUsers: 1, maxUsers: 25, monthlyFee: 5000, includedStaffSeats: 2,
      features: [], status: 'active', currency: '₹',
    }]);
    write('hospitals.json', [
      { id: 'H001', name: 'Test Hospital', city: 'Tirupati', verificationStatus: 'verified' },
    ]);
    write('users.json', staff);
    write('hospital-subscriptions.json', []);
    write('patient-subscriptions.json', []);
    write('appointments.json', []);
    write('ambulance.json', []);
    write('beds.json', []);
    write('billing.json', []);
    write('platform-transactions.json', []);

    jest.spyOn(process, 'cwd').mockReturnValue(dir);
    pricing = new PricingService();
    revenue = new RevenueService(pricing);
    payments = new PaymentsService(pricing);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const streamNamed = (data: any, key: string) =>
    data.byStream.find((s: any) => s.key === key);

  describe('the streams that exist', () => {
    it('reports a hospital subscription and no longer bills doctors', async () => {
      const res: any = await revenue.getPlatformStreams();
      expect(res.success).toBe(true);

      const keys = res.data.byStream.map((s: any) => s.key);
      expect(keys).toEqual(expect.arrayContaining([
        'hospital_subscription', 'payment_gateway_fee', 'patient_membership',
        'patient_booking_fee', 'ambulance_dispatch_fee',
      ]));
      expect(keys).not.toContain('doctor_subscription');
      expect(keys).not.toContain('doctor_commission');
      expect(keys).not.toContain('hospital_commission');
    });

    it('has only two payers — hospitals and patients', async () => {
      const res: any = await revenue.getPlatformStreams();
      expect(res.data.byPayer.map((p: any) => p.payer)).toEqual(['hospital', 'patient']);
    });
  });

  describe('the hospital subscription', () => {
    it('charges the plan fee plus the seats over its allowance', async () => {
      const res: any = await revenue.getPlatformStreams();
      const line = streamNamed(res.data, 'hospital_subscription');

      // 3 billable staff (the patient does not hold a seat) on a 2-seat plan:
      // ₹5,000 + one extra seat at ₹250.
      expect(line.units).toBe(3);
      expect(line.amount).toBe(5250);
    });

    it('does not bill a hospital that is still awaiting verification', async () => {
      // A pending registration cannot log anybody in, so charging it would put
      // revenue on the dashboard that nobody agreed to pay. Regression test for
      // the seeded `pending_verification` hospital that was being billed a full
      // Starter plan on zero staff accounts.
      write('hospitals.json', [
        { id: 'H001', name: 'Test Hospital', city: 'Tirupati', verificationStatus: 'verified' },
        { id: 'H099', name: 'Applicant Hospital', city: 'Tirupati', verificationStatus: 'pending_verification' },
      ]);

      const res: any = await revenue.getPlatformStreams();
      const line = streamNamed(res.data, 'hospital_subscription');

      // Unchanged: only the verified hospital's 3 seats and ₹5,250 are billed.
      expect(line.units).toBe(3);
      expect(line.amount).toBe(5250);

      const overview: any = await revenue.getPlatformOverview();
      expect(overview.data.byHospital.map((l: any) => l.hospitalId)).not.toContain('H099');
    });

    it('does not bill a hospital whose registration was rejected', async () => {
      write('hospitals.json', [
        { id: 'H001', name: 'Test Hospital', city: 'Tirupati', verificationStatus: 'verified' },
        { id: 'H098', name: 'Turned Down', city: 'Tirupati', verificationStatus: 'rejected' },
      ]);

      const res: any = await revenue.getPlatformStreams();
      expect(streamNamed(res.data, 'hospital_subscription').amount).toBe(5250);
    });

    it('does not count patients, and does not count an inactive account', async () => {
      write('users.json', staff.concat([
        { id: 'X1', name: 'Left Last Month', email: 'x@x.com', role: 'doctor', hospitalId: 'H001', status: 'Inactive' } as any,
      ]));

      const res: any = await revenue.getPlatformStreams();
      expect(streamNamed(res.data, 'hospital_subscription').units).toBe(3);
    });

    it('charges the same whatever the hospital collects — no commission', async () => {
      const before: any = await revenue.getPlatformStreams();
      write('billing.json', [{
        id: 'B1', patientId: 'P1', hospitalId: 'H001', status: 'Paid',
        currency: '₹', total: 500000, items: [], payments: [], createdAt: '2026-08-10T00:00:00.000Z',
      }]);

      const after: any = await revenue.getPlatformStreams();
      expect(streamNamed(after.data, 'hospital_subscription').amount)
        .toBe(streamNamed(before.data, 'hospital_subscription').amount);
    });

    it('bills a hospital nobody enrolled, on the plan its headcount puts it on', async () => {
      await revenue.getPlatformStreams();
      const subs = pricing.loadHospitalSubscriptions();
      expect(subs).toHaveLength(1);
      expect(subs[0].hospitalId).toBe('H001');
      expect(subs[0].planId).toBe('HOSP-STARTER');
      expect(subs[0].staffAtSignup).toBe(3);
    });
  });

  describe('the per-transaction fees', () => {
    it('reads the processing fee from the ledger, at the rate recorded on the row', async () => {
      // Deliberately NOT the current 1% — a historical row must keep its own
      // rate, so that repricing today cannot restate what was earned then.
      write('platform-transactions.json', [
        { id: 'T1', stream: 'payment_gateway_fee', sourceType: 'bill', sourceId: 'B1', hospitalId: 'H001',
          gross: 10000, rate: 0.019, amount: 190, currency: '₹', createdAt: '2026-08-01T00:00:00.000Z', origin: 'gateway' },
      ]);

      const res: any = await revenue.getPlatformStreams();
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
  });

  it('adds every stream up to the reported total', async () => {
    const res: any = await revenue.getPlatformStreams();
    const summed = res.data.byStream.reduce((t: number, s: any) => t + s.amount, 0);
    expect(Math.round(summed * 100) / 100).toBe(res.data.totalRevenue);
  });

  describe('a doctor is not billed', () => {
    it('reports consultation revenue with nothing deducted', async () => {
      write('appointments.json', [
        { id: 'A1', patientId: 'P1', doctorId: 'D1', doctor: 'Dr. One', fee: 1000, status: 'Completed', createdAt: '2026-08-01T00:00:00.000Z', hospitalId: 'H001' },
        { id: 'A2', patientId: 'P1', doctorId: 'D1', doctor: 'Dr. One', fee: 1000, status: 'Confirmed', createdAt: '2026-08-02T00:00:00.000Z', hospitalId: 'H001' },
      ]);

      const res: any = await revenue.getDoctorEarnings('D1');
      expect(res.success).toBe(true);
      expect(res.data.grossEarnings).toBe(1000);   // only the completed one
      expect(res.data.appointmentsCompleted).toBe(1);
      expect(res.data.appointmentsBooked).toBe(2);
      // Nothing the platform takes appears on a doctor's statement any more.
      expect(res.data.platformCommission).toBeUndefined();
      expect(res.data.platformListingFee).toBeUndefined();
    });
  });

  describe('end to end: a paid bill moves the dashboard', () => {
    it('turns one card payment into exactly the processing fee', async () => {
      write('billing.json', [{
        id: 'BILL-1', patientId: 'P1', hospitalId: 'H001', status: 'Pending',
        currency: '₹', total: 20000, items: [], payments: [], createdAt: '2026-08-10T00:00:00.000Z',
      }]);

      const before: any = await revenue.getPlatformStreams();
      expect(streamNamed(before.data, 'payment_gateway_fee').amount).toBe(0);

      const intent: any = await payments.createIntent('BILL-1', 'P1');
      const paid: any = await payments.confirmIntent(
        intent.data.id,
        { number: '4242424242424242', expiryMonth: 12, expiryYear: 2035, cvv: '123' },
        'e2e-1', 'P1',
      );
      expect(paid.success).toBe(true);

      const after: any = await revenue.getPlatformStreams();
      // ₹20,000 at 1% processing, and no commission on top of it.
      expect(streamNamed(after.data, 'payment_gateway_fee').amount).toBe(200);
      expect(after.data.totalRevenue - before.data.totalRevenue).toBe(200);
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

  describe("what a hospital's own manager is shown", () => {
    it('itemises the subscription and the processing fee, with no commission line', async () => {
      write('billing.json', [{
        id: 'B1', patientId: 'P1', hospitalId: 'H001', status: 'Paid',
        currency: '₹', total: 10000, items: [], payments: [], createdAt: '2026-08-10T00:00:00.000Z',
      }]);
      write('platform-transactions.json', [
        { id: 'T1', stream: 'payment_gateway_fee', sourceType: 'bill', sourceId: 'B1', hospitalId: 'H001',
          gross: 10000, rate: 0.01, amount: 100, currency: '₹', createdAt: '2026-08-10T00:00:00.000Z', origin: 'gateway' },
      ]);

      const res: any = await revenue.getHospitalRevenue('H001');
      const pc = res.data.platformCharges;

      expect(pc.planName).toBe('Starter');
      expect(pc.staffSeats).toBe(3);
      expect(pc.includedSeats).toBe(2);
      expect(pc.baseFee).toBe(5000);
      expect(pc.extraSeatFee).toBe(250);
      expect(pc.subscription).toBe(5250);
      expect(pc.processingFees).toBe(100);
      expect(pc.total).toBe(5350);
      expect(pc.commission).toBeUndefined();
    });
  });
});
