import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Hospital, CreateHospitalDto, UpdateHospitalDto, HospitalPaymentRecord } from './interfaces/hospital.interface';
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
   * Get subscription details, countdown days, and status for a hospital
   */
  async getSubscriptionDetails(hospitalId: string) {
    try {
      const hospital = this.hospitals.find(h => h.id === hospitalId);
      if (!hospital) {
        return ResponseUtil.notFound('Hospital', hospitalId);
      }

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Default to 1 year from creation if not explicitly set
      let expiryDateStr = hospital.subscriptionExpiryDate;
      if (!expiryDateStr) {
        const created = hospital.createdAt ? new Date(hospital.createdAt) : new Date();
        const exp = new Date(created);
        exp.setFullYear(exp.getFullYear() + 1);
        expiryDateStr = exp.toISOString().split('T')[0];
      }

      const expiryDate = new Date(expiryDateStr);
      expiryDate.setHours(0, 0, 0, 0);

      const diffTime = expiryDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status = 'ACTIVE';
      let warningLevel = 'ok';
      let warningMessage = '';

      if (daysRemaining <= 0) {
        status = 'EXPIRED';
        warningLevel = 'expired';
        warningMessage = 'Hospital Registration Expired. Please renew immediately to restore full service access.';
      } else if (daysRemaining <= 7) {
        status = 'DUE_SOON';
        warningLevel = 'urgent_7';
        warningMessage = `URGENT: NexCare registration expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`;
      } else if (daysRemaining <= 30) {
        status = 'DUE_SOON';
        warningLevel = 'warning_30';
        warningMessage = `Hospital registration renewal is due soon (${daysRemaining} days remaining).`;
      } else if (daysRemaining <= 90) {
        status = 'ACTIVE';
        warningLevel = 'warning_90';
        warningMessage = `Your NexCare hospital registration expires in ${daysRemaining} days.`;
      }

      return ResponseUtil.success('Subscription details retrieved successfully', {
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        planName: 'NexCare Annual Enterprise License',
        durationMonths: 12,
        registrationDate: hospital.createdAt ? hospital.createdAt.split('T')[0] : '2025-01-01',
        subscriptionStartDate: hospital.subscriptionStartDate || (hospital.createdAt ? hospital.createdAt.split('T')[0] : '2025-01-01'),
        subscriptionExpiryDate: expiryDateStr,
        lastPaymentDate: hospital.lastPaymentDate || hospital.createdAt || '2025-01-01',
        amountPaid: hospital.amountPaid || 50000,
        daysRemaining: Math.max(0, daysRemaining),
        status,
        warningLevel,
        warningMessage,
        transactionId: hospital.transactionId || 'TXN-NEX-INIT-001',
        paymentHistory: hospital.paymentHistory || []
      });
    } catch (error) {
      return ResponseUtil.serverError('Failed to get subscription details');
    }
  }

  /**
   * Renew hospital registration subscription for 12 months with mock payment
   */
  async renewSubscription(hospitalId: string, renewalDto: any) {
    try {
      const all = this.hospitals;
      const idx = all.findIndex(h => h.id === hospitalId);
      if (idx === -1) {
        return ResponseUtil.notFound('Hospital', hospitalId);
      }

      const hospital = all[idx];
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Determine base date: if current subscription is still active in future, extend from expiry; otherwise from now
      let baseDate = now;
      if (hospital.subscriptionExpiryDate) {
        const currentExp = new Date(hospital.subscriptionExpiryDate);
        if (currentExp > now) {
          baseDate = currentExp;
        }
      }

      // Add 12 months
      const newExpiryDate = new Date(baseDate);
      newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
      const newExpiryStr = newExpiryDate.toISOString().split('T')[0];

      const txnId = 'TXN-NEX-' + Date.now().toString().slice(-6) + '-' + Math.floor(1000 + Math.random() * 9000);
      const amount = Number(renewalDto?.amount) || 50000;
      const paymentMethod = renewalDto?.paymentMethod || 'UPI';

      const paymentRecord: HospitalPaymentRecord = {
        id: IdGenerator.generate('PAY'),
        date: new Date().toISOString(),
        amount,
        paymentType: paymentMethod,
        transactionId: txnId,
        previousExpiry: hospital.subscriptionExpiryDate || now.toISOString().split('T')[0],
        newExpiry: newExpiryStr,
        status: 'PAID'
      };

      const updatedHistory = [paymentRecord, ...(hospital.paymentHistory || [])];

      all[idx] = {
        ...hospital,
        subscriptionStartDate: hospital.subscriptionStartDate || now.toISOString().split('T')[0],
        subscriptionExpiryDate: newExpiryStr,
        lastPaymentDate: new Date().toISOString(),
        amountPaid: (hospital.amountPaid || 0) + amount,
        paymentStatus: 'ACTIVE',
        renewalStatus: 'UP_TO_DATE',
        transactionId: txnId,
        paymentHistory: updatedHistory,
        updatedAt: new Date().toISOString()
      };

      this.hospitals = all;

      return ResponseUtil.success('Hospital registration renewed successfully', {
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        newExpiryDate: newExpiryStr,
        previousExpiryDate: paymentRecord.previousExpiry,
        daysRemaining: Math.ceil((newExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        transactionId: txnId,
        paymentRecord,
        status: 'ACTIVE'
      });
    } catch (error) {
      return ResponseUtil.serverError('Failed to renew subscription');
    }
  }

  /**
   * Get payment history for a hospital
   */
  async getPaymentHistory(hospitalId: string) {
    try {
      const hospital = this.hospitals.find(h => h.id === hospitalId);
      if (!hospital) {
        return ResponseUtil.notFound('Hospital', hospitalId);
      }
      return ResponseUtil.success('Payment history retrieved successfully', hospital.paymentHistory || []);
    } catch (error) {
      return ResponseUtil.serverError('Failed to get payment history');
    }
  }
}
