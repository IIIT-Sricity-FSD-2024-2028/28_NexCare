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
});
