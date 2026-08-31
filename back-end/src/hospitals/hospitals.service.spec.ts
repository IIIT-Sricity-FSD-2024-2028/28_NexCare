import { HospitalsService } from './hospitals.service';

describe('HospitalsService - Filtering', () => {
  let service: HospitalsService;

  beforeEach(() => {
    service = new HospitalsService();
  });

  it('should return all hospitals when no filter parameters are supplied', async () => {
    const res = await service.findAll();
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('should filter by speciality case-insensitively', async () => {
    const res = await service.findAll(undefined, ' cardiology ');
    expect(res.success).toBe(true);
    const hospitals = res.data as any[];
    expect(hospitals.length).toBeGreaterThan(0);
    hospitals.forEach(h => {
      const specs = (h.specialities || []).map((s: string) => s.toLowerCase());
      expect(specs).toContain('cardiology');
    });
  });

  it('should filter by city case-insensitively', async () => {
    const res = await service.findAll(undefined, undefined, ' CHENNAI ');
    expect(res.success).toBe(true);
    const hospitals = res.data as any[];
    expect(hospitals.length).toBeGreaterThan(0);
    hospitals.forEach(h => {
      expect(h.city.toLowerCase()).toBe('chennai');
    });
  });

  it('should filter by pincode', async () => {
    const res = await service.findAll(undefined, undefined, undefined, '600001');
    expect(res.success).toBe(true);
    const hospitals = res.data as any[];
    expect(hospitals.length).toBeGreaterThan(0);
    hospitals.forEach(h => {
      expect(h.pincode).toBe('600001');
    });
  });

  it('should combine filters using AND logic', async () => {
    const res = await service.findAll(undefined, 'Cardiology', 'Chennai', '600001');
    expect(res.success).toBe(true);
    const hospitals = res.data as any[];
    expect(hospitals.length).toBeGreaterThan(0);
    hospitals.forEach(h => {
      expect(h.city.toLowerCase()).toBe('chennai');
      expect(h.pincode).toBe('600001');
      const specs = (h.specialities || []).map((s: string) => s.toLowerCase());
      expect(specs).toContain('cardiology');
    });
  });

  it('should return every verified hospital for nearby discovery while ranking local matches first', async () => {
    const hospitals = [
      {
        id: 'H001',
        name: 'Local Hospital',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        verificationStatus: 'verified',
      },
      {
        id: 'H002',
        name: 'Cross-state Hospital',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        verificationStatus: 'verified',
      },
      {
        id: 'H003',
        name: 'Same-state Hospital',
        city: 'Vellore',
        state: 'Tamil Nadu',
        pincode: '632004',
        verificationStatus: 'verified',
      },
      {
        id: 'H004',
        name: 'Unverified Hospital',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        verificationStatus: 'pending_verification',
      },
    ];

    Object.defineProperty(service as any, 'hospitals', {
      configurable: true,
      get: () => hospitals,
    });

    const res = await service.findNearby('Chennai', 'Tamil Nadu', '600001');
    const result = res.data as any[];

    expect(res.success).toBe(true);
    expect(result.map(hospital => hospital.id)).toEqual(
      expect.arrayContaining(['H001', 'H002', 'H003']),
    );
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('H001');
    expect(result.some(hospital => hospital.id === 'H004')).toBe(false);
  });
});
