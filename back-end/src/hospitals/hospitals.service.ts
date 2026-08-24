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

  async findAll(status?: VerificationStatus) {
    try {
      let result = this.hospitals;
      if (status) {
        result = result.filter(h => h.verificationStatus === status);
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
        (h) => h.verificationStatus === VerificationStatus.VERIFIED,
      );

      // Sort logic: 
      // 1. Same pincode
      // 2. Same city
      // 3. Same state
      verified.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        
        if (pincode && a.pincode === pincode) scoreA += 3;
        if (pincode && b.pincode === pincode) scoreB += 3;
        
        if (city && a.city?.toLowerCase() === city.toLowerCase()) scoreA += 2;
        if (city && b.city?.toLowerCase() === city.toLowerCase()) scoreB += 2;
        
        if (state && a.state?.toLowerCase() === state.toLowerCase()) scoreA += 1;
        if (state && b.state?.toLowerCase() === state.toLowerCase()) scoreB += 1;
        
        return scoreB - scoreA;
      });

      return ResponseUtil.success('Nearby hospitals retrieved successfully', verified);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve nearby hospitals');
    }
  }
}
