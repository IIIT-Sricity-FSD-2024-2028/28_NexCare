import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Hospital, CreateHospitalDto, UpdateHospitalDto } from './interfaces/hospital.interface';
import { VerificationStatus } from '../common/interfaces/api-response.interface';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';

@Injectable()
export class HospitalsService {
  private readonly hospitalsFilePath = path.join(process.cwd(), 'data', 'hospitals.json');

  private get hospitals(): Hospital[] {
    try {
      const raw = fs.readFileSync(this.hospitalsFilePath, 'utf-8');
      return JSON.parse(raw) as Hospital[];
    } catch {
      return [];
    }
  }

  private set hospitals(val: Hospital[]) {
    try {
      fs.mkdirSync(path.dirname(this.hospitalsFilePath), { recursive: true });
      fs.writeFileSync(this.hospitalsFilePath, JSON.stringify(val, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist hospitals to disk:', err);
    }
  }

  async findAll(
    status?: VerificationStatus,
    speciality?: string,
    city?: string,
    pincode?: string
  ) {
    try {
      let result = this.hospitals;
      if (status) {
        result = result.filter(h => h.verificationStatus === status);
      }
      if (speciality && speciality.trim() !== '') {
        const targetSpec = speciality.trim().toLowerCase();
        result = result.filter((h: any) => {
          const specsArray = Array.isArray(h.specialities)
            ? h.specialities
            : Array.isArray(h.specialties)
            ? h.specialties
            : null;

          if (specsArray) {
            const hasMatch = specsArray.some(
              (s: any) => typeof s === 'string' && s.trim().toLowerCase() === targetSpec
            );
            if (hasMatch) return true;
          }

          if (typeof h.speciality === 'string' && h.speciality.trim().toLowerCase() === targetSpec) {
            return true;
          }
          if (typeof h.specialty === 'string' && h.specialty.trim().toLowerCase() === targetSpec) {
            return true;
          }

          if (Array.isArray(h.doctors)) {
            const docMatch = h.doctors.some(
              (d: any) =>
                (typeof d.speciality === 'string' && d.speciality.trim().toLowerCase() === targetSpec) ||
                (typeof d.specialty === 'string' && d.specialty.trim().toLowerCase() === targetSpec) ||
                (typeof d.department === 'string' && d.department.trim().toLowerCase() === targetSpec)
            );
            if (docMatch) return true;
          }
          if (Array.isArray(h.departments)) {
            const deptMatch = h.departments.some(
              (d: any) =>
                (typeof d === 'string' && d.trim().toLowerCase() === targetSpec) ||
                (typeof d?.name === 'string' && d.name.trim().toLowerCase() === targetSpec)
            );
            if (deptMatch) return true;
          }

          return false;
        });
      }

      if (city && city.trim() !== '') {
        const targetCity = city.trim().toLowerCase();
        result = result.filter(
          h => h.city && h.city.trim().toLowerCase() === targetCity
        );
      }

      if (pincode && pincode.trim() !== '') {
        const targetPincode = pincode.trim();
        result = result.filter(
          h => h.pincode && h.pincode.trim() === targetPincode
        );
      }

      return ResponseUtil.success('Hospitals retrieved successfully', result);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve hospitals');
    }
  }

  async findById(id: string) {
    try {
      const hospital = this.hospitals.find(h => h.id === id);
      if (!hospital) {
        return ResponseUtil.notFound('Hospital', id);
      }
      return ResponseUtil.success('Hospital retrieved successfully', hospital);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve hospital');
    }
  }

  async create(data: CreateHospitalDto) {
    try {
      const validationError = this.validateRegistration(data);
      if (validationError) return ResponseUtil.validationError(validationError);

      const registrationNumber = data.registrationNumber.trim().toUpperCase();
      const existing = this.hospitals.find(
        h => h.registrationNumber.trim().toUpperCase() === registrationNumber,
      );
      if (existing) {
        return ResponseUtil.error('Hospital with this registration number already exists');
      }

      const newHospital: Hospital = {
        ...data,
        registrationNumber,
        email: data.email.trim().toLowerCase(),
        adminEmail: data.adminEmail.trim().toLowerCase(),
        id: IdGenerator.generate('H'),
        verificationStatus: VerificationStatus.PENDING_VERIFICATION,
        regionalReviewStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const all = this.hospitals;
      all.push(newHospital);
      this.hospitals = all;

      return ResponseUtil.created('Hospital registered successfully', newHospital);
    } catch (error) {
      return ResponseUtil.serverError('Failed to register hospital');
    }
  }

  /** Records a regional manager's due-diligence decision; it never activates a hospital. */
  async recordRegionalReview(
    id: string,
    managerId: string,
    decision: 'cleared' | 'rejected',
    notes?: string,
  ) {
    const all = this.hospitals;
    const idx = all.findIndex(h => h.id === id);
    if (idx === -1) return ResponseUtil.notFound('Hospital', id);
    const hospital = all[idx];

    if (hospital.assignedManagerId !== managerId) {
      return ResponseUtil.forbidden('This registration is not assigned to you');
    }
    if (hospital.verificationStatus !== VerificationStatus.PENDING_VERIFICATION) {
      return ResponseUtil.error('Only pending registrations can be reviewed');
    }

    all[idx] = {
      ...hospital,
      regionalReviewStatus: decision,
      regionalReviewedAt: new Date().toISOString(),
      regionalReviewNotes: notes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    this.hospitals = all;
    return ResponseUtil.updated(`Regional review ${decision}`, all[idx]);
  }

  private validateRegistration(data: CreateHospitalDto): string | null {
    const requiredText: Array<[keyof CreateHospitalDto, string]> = [
      ['name', 'Hospital name'], ['registrationNumber', 'Registration number'], ['type', 'Hospital type'],
      ['ownershipType', 'Ownership type'], ['address', 'Address'], ['city', 'City'], ['state', 'State'],
      ['pincode', 'PIN code'], ['phone', 'Official phone'], ['email', 'Official email'],
      ['adminName', 'Administrator name'], ['adminEmail', 'Administrator email'], ['adminPhone', 'Administrator phone'],
    ];
    for (const [field, label] of requiredText) {
      if (typeof data[field] !== 'string' || !data[field].trim()) return `${label} is required`;
    }
    if (!/^\d{6}$/.test(data.pincode.trim())) return 'PIN code must contain exactly 6 digits';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return 'Official email is invalid';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.adminEmail.trim())) return 'Administrator email is invalid';
    const phone = (value: string) => /^\+?[0-9][0-9\s()-]{8,14}$/.test(value.trim());
    if (!phone(data.phone)) return 'Official phone must contain 10 to 15 digits';
    if (!/^\+?[0-9][0-9\s()-]{8,14}$/.test(data.adminPhone.trim())) return 'Administrator phone must contain 10 to 15 digits';
    if (!Number.isInteger(Number(data.totalBeds)) || Number(data.totalBeds) < 1) return 'Total beds must be at least 1';
    if (!Number.isInteger(Number(data.icuBeds)) || Number(data.icuBeds) < 0) return 'ICU beds cannot be negative';
    if (Number(data.icuBeds) > Number(data.totalBeds)) return 'ICU beds cannot exceed total beds';
    if (!Array.isArray(data.specialities) || data.specialities.length === 0) return 'At least one speciality is required';
    return null;
  }

  async update(id: string, updateData: UpdateHospitalDto) {
    try {
      const all = this.hospitals;
      const idx = all.findIndex(h => h.id === id);
      if (idx === -1) return ResponseUtil.notFound('Hospital', id);

      all[idx] = {
        ...all[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      this.hospitals = all;

      return ResponseUtil.updated('Hospital updated successfully', all[idx]);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update hospital');
    }
  }
  async findNearby(city?: string, state?: string, pincode?: string) {
    try {
      const verified = this.hospitals.filter(
        (h) => !h.verificationStatus || h.verificationStatus === VerificationStatus.VERIFIED,
      );

      // Proximity score: same pincode (3) > same city (2) > same state (1).
      const score = (h: Hospital) => {
        let s = 0;
        if (pincode && h.pincode === pincode) s += 3;
        if (city && h.city?.toLowerCase() === city.toLowerCase()) s += 2;
        if (state && h.state?.toLowerCase() === state.toLowerCase()) s += 1;
        return s;
      };

      const hasLocation = !!(pincode || city || state);

      // When a location is supplied, actually narrow to hospitals that share
      // at least the state/city/pincode. If nothing matches locally, fall back
      // to the full verified list so the patient still sees options.
      let result = verified;
      if (hasLocation) {
        const local = verified.filter(h => score(h) > 0);
        result = local.length > 0 ? local : verified;
      }

      result.sort((a, b) => score(b) - score(a));

      return ResponseUtil.success('Nearby hospitals retrieved successfully', result);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve nearby hospitals');
    }
  }

  /**
   * Get hospital performance metrics
   * Used by regional managers to track hospital performance
   */
  async getHospitalPerformance(hospitalId: string) {
    try {
      const hospital = this.hospitals.find(h => h.id === hospitalId);
      if (!hospital) {
        return ResponseUtil.notFound('Hospital', hospitalId);
      }

      // Calculate basic performance metrics
      const performanceMetrics = {
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        bedOccupancyRate: hospital.performanceMetrics?.bedOccupancyRate || 0,
        appointmentCompletionRate: hospital.performanceMetrics?.appointmentCompletionRate || 0,
        patientSatisfactionScore: hospital.performanceMetrics?.patientSatisfactionScore || 0,
        totalBeds: hospital.totalBeds,
        icuBeds: hospital.icuBeds,
        verificationStatus: hospital.verificationStatus,
        lastUpdated: hospital.performanceMetrics?.lastUpdated || hospital.updatedAt
      };

      return ResponseUtil.success('Hospital performance retrieved successfully', performanceMetrics);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve hospital performance');
    }
  }

  /**
   * Update hospital performance metrics
   * Used to update performance data
   */
  async updatePerformanceMetrics(hospitalId: string, metrics: any) {
    try {
      const all = this.hospitals;
      const idx = all.findIndex(h => h.id === hospitalId);
      if (idx === -1) return ResponseUtil.notFound('Hospital', hospitalId);

      all[idx] = {
        ...all[idx],
        performanceMetrics: {
          ...all[idx].performanceMetrics,
          ...metrics,
          lastUpdated: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      };
      this.hospitals = all;

      return ResponseUtil.updated('Hospital performance metrics updated successfully', all[idx].performanceMetrics);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update hospital performance metrics');
    }
  }
}
