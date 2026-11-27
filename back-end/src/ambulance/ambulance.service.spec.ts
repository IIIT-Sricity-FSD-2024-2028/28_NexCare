import { AmbulanceService } from './ambulance.service';
import { AmbulanceStatus, UserRole } from '../common/interfaces/api-response.interface';

// One crew login = one ambulance of one hospital. These tests pin down that a
// request only ever goes to a free crew of its own hospital, and that the
// vehicle and driver come from that crew's account.
describe('AmbulanceService - hospital fleet and dispatch', () => {
  let service: AmbulanceService;
  let requests: any[];
  let users: any[];
  let hospitals: any[];

  const crew = (id: string, hospitalId: string, vehicle?: string, extra: any = {}) => ({
    id, role: UserRole.AMBULANCE, status: 'Active', hospitalId, name: `${id} Crew`,
    driverName: `Driver ${id}`, phone: '+91 90000 00000', assignedVehicle: vehicle, ...extra,
  });
  const pending = (id: string, hospitalId: string) => ({
    id, patientId: 'P100', patientName: 'Test Patient', pickupLocation: 'Main Road', contact: '+91 1',
    status: AmbulanceStatus.PENDING, hospitalId, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
  });

  beforeEach(() => {
    hospitals = [
      { id: 'H001', name: 'City Hospital', verificationStatus: 'verified', ambulanceService: true },
      { id: 'H002', name: 'Coastal Hospital', verificationStatus: 'verified', ambulanceService: true },
      { id: 'H010', name: 'Clinic Without Ambulances', verificationStatus: 'verified', ambulanceService: false },
    ];
    users = [
      crew('C1', 'H001', 'AP 03 AB 0001'),
      crew('C2', 'H001', 'AP 03 AB 0002'),
      crew('C3', 'H002', 'AP 26 CD 0003'),
      crew('C4', 'H001'), // registered without a vehicle
      crew('C5', 'H001', 'AP 03 AB 0005', { status: 'Inactive' }),
      { id: 'S1', role: UserRole.ADMINISTRATIVE_STAFF, hospitalId: 'H001', name: 'Desk' },
    ];
    requests = [pending('R1', 'H001'), pending('R2', 'H001')];

    service = new AmbulanceService(
      { createActivity: jest.fn() } as any,
      { findById: jest.fn().mockResolvedValue({ success: true, data: { fullName: 'Test Patient' } }) } as any,
      { addChargeToPendingBill: jest.fn() } as any,
    );
    const stub = (get: () => any[], set: (v: any[]) => void) => ({ load: () => get(), save: (v: any[]) => set(v) });
    (service as any).store = stub(() => requests, (v) => { requests = v; });
    (service as any).usersStore = stub(() => users, () => {});
    (service as any).hospitalsStore = stub(() => hospitals, () => {});
  });

  it('dispatches to a crew of the same hospital and stamps that crew\'s vehicle and driver', async () => {
    const res: any = await service.dispatch('R1', 'C1', 'S1');
    expect(res.success).toBe(true);
    expect(res.data).toMatchObject({
      status: AmbulanceStatus.DISPATCHED, assignedTo: 'C1', vehicleNumber: 'AP 03 AB 0001', driverName: 'Driver C1',
    });
  });

  it('refuses a crew from another hospital', async () => {
    const res: any = await service.dispatch('R1', 'C3');
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/another hospital/);
    expect(requests[0].status).toBe(AmbulanceStatus.PENDING);
  });

  it('refuses a crew that is already out on a transport', async () => {
    await service.dispatch('R1', 'C1');
    const res: any = await service.dispatch('R2', 'C1');
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/already on transport R1/);
  });

  it('frees the crew once its transport completes', async () => {
    await service.dispatch('R1', 'C1');
    await service.complete('R1');
    const res: any = await service.dispatch('R2', 'C1');
    expect(res.success).toBe(true);
  });

  it('refuses a non-crew account, a crew without a vehicle and an off-duty crew', async () => {
    expect(((await service.dispatch('R1', 'S1')) as any).message).toMatch(/not an ambulance crew/);
    expect(((await service.dispatch('R1', 'C4')) as any).message).toMatch(/no vehicle/);
    expect(((await service.dispatch('R1', 'C5')) as any).message).toMatch(/not on duty/);
  });

  it('does not invent a driver for an unassigned request', async () => {
    const res: any = await service.findById('R1');
    expect(res.data.driverName).toBeUndefined();
    expect(res.data.vehicleNumber).toBeUndefined();
  });

  it('refuses a request to a hospital without an ambulance service', async () => {
    const res: any = await service.create({ patientId: 'P200', pickupLocation: 'x', contact: '1', hospitalId: 'H010' } as any);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/no ambulance service/);
  });

  it('will not let an edit assign a crew or skip dispatch', async () => {
    const res: any = await service.update('R1', { status: AmbulanceStatus.EN_ROUTE } as any);
    expect(res.success).toBe(false);
    await service.update('R1', { assignedTo: 'C3', vehicleNumber: 'FAKE', notes: 'n' } as any);
    expect(requests[0]).toMatchObject({ notes: 'n' });
    expect(requests[0].assignedTo).toBeUndefined();
    expect(requests[0].vehicleNumber).toBeUndefined();
  });

  it('cancel assignment returns the request to the queue without a driver, and frees the crew', async () => {
    await service.dispatch('R1', 'C1');
    const res: any = await service.update('R1', { status: AmbulanceStatus.PENDING } as any);
    expect(res.success).toBe(true);
    expect(requests[0].status).toBe(AmbulanceStatus.PENDING);
    for (const f of ['assignedTo', 'driverName', 'driverPhone', 'vehicleNumber', 'assignedDriver']) {
      expect(requests[0][f]).toBeUndefined();
    }
    expect(((await service.dispatch('R2', 'C1')) as any).success).toBe(true);
  });

  it('a transport already on the road cannot be handed back', async () => {
    await service.dispatch('R1', 'C1');
    await service.updateStatus('R1', AmbulanceStatus.EN_ROUTE);
    const res: any = await service.update('R1', { status: AmbulanceStatus.PENDING } as any);
    expect(res.success).toBe(false);
    expect(requests[0].assignedTo).toBe('C1');
  });

  it('reports each hospital\'s fleet: total, free, out on a job and waiting', async () => {
    await service.dispatch('R1', 'C1');
    const res: any = service.fleet('H001');
    expect(res.data).toMatchObject({ total: 4, available: 1, onTransport: 1, unavailable: 2, waiting: 1, ambulanceService: true });
    expect(res.data.crews.find((c: any) => c.id === 'C1').currentRequest.id).toBe('R1');
    const patientView: any = service.fleet('H001', false);
    expect(patientView.data.crews).toBeUndefined();
  });
});
