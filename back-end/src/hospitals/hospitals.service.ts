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
      const existing = this.hospitals.find(h => h.registrationNumber === data.registrationNumber);
      if (existing) {
        return ResponseUtil.error('Hospital with this registration number already exists');
      }

      const newHospital: Hospital = {
        ...data,
        id: IdGenerator.generate('H'),
        verificationStatus: VerificationStatus.PENDING_VERIFICATION,
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

      const targetCity = city ? city.trim().toLowerCase() : null;
      const targetState = state ? state.trim().toLowerCase() : null;
      const targetPincode = pincode ? pincode.trim() : null;

      // Sort logic: 
      // 1. Same pincode (+3)
      // 2. Same city (+2)
      // 3. Same state (+1)
      verified.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        
        if (targetPincode && String(a.pincode || '').trim() === targetPincode) scoreA += 3;
        if (targetPincode && String(b.pincode || '').trim() === targetPincode) scoreB += 3;
        
        if (targetCity && String(a.city || '').trim().toLowerCase() === targetCity) scoreA += 2;
        if (targetCity && String(b.city || '').trim().toLowerCase() === targetCity) scoreB += 2;
        
        if (targetState && String(a.state || '').trim().toLowerCase() === targetState) scoreA += 1;
        if (targetState && String(b.state || '').trim().toLowerCase() === targetState) scoreB += 1;
        
        return scoreB - scoreA;
      });

      return ResponseUtil.success('Nearby hospitals retrieved successfully', verified);
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
