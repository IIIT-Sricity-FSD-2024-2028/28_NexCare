import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { ArrayUtil } from '../common/utils/array.util';
import { Patient, CreatePatientRequest, UpdatePatientRequest, PatientStats } from './interfaces/patient.interface';
import { SystemService } from '../system/system.service';

/**
 * Patients Service
 * Manages patient records and profiles in the NexCare system
 * Handles CRUD operations for patient data with medical information
 */
@Injectable()
export class PatientsService {
  constructor(private readonly systemService: SystemService) {}

  private readonly patientsFilePath = path.join(process.cwd(), 'data', 'patients.json');

  /** Load patients from disk */
  private loadPatients(): Patient[] {
    try {
      if (!fs.existsSync(this.patientsFilePath)) {
        const initial = this.getInitialMockData();
        this.savePatients(initial);
        return initial;
      }
      const raw = fs.readFileSync(this.patientsFilePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return this.getInitialMockData();
    }
  }

  /** Persist patients to disk */
  private savePatients(patients: Patient[]): void {
    try {
      fs.mkdirSync(path.dirname(this.patientsFilePath), { recursive: true });
      fs.writeFileSync(this.patientsFilePath, JSON.stringify(patients, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist patients:', err);
    }
  }

  private getInitialMockData(): Patient[] {
    return [
      {
        id: 'P001',
        fullName: 'John Anderson',
        phone: '5551234567',
        email: 'patient@gmail.com',
        patientIdDisplay: 'PAT-2026-001',
        memberSince: 'January 2024',
        status: 'Active',
        bloodGroup: 'O+',
        age: 45,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'P002',
        fullName: 'Maria Garcia',
        phone: '5559876543',
        email: 'maria@example.com',
        patientIdDisplay: 'PAT-2026-002',
        memberSince: 'March 2025',
        status: 'Critical',
        bloodGroup: 'AB-',
        age: 62,
        createdAt: '2025-03-01T00:00:00Z'
      }
    ];
  }


  /**
   * Get all patients with optional filtering
   * @param status Optional status filter
   * @returns List of patients
   */
  async findAll(status?: string) {
    try {
      const patients = this.loadPatients();
      let filteredPatients = [...patients];

      // Apply status filter
      if (status) {
        filteredPatients = filteredPatients.filter(patient => patient.status === status);
      }

      return ResponseUtil.success('Patients retrieved successfully', filteredPatients);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve patients');
    }
  }

  /**
   * Get patient by ID
   * @param id Patient ID
   * @returns Patient data
   */
  async findById(id: string) {
    try {
      const patients = this.loadPatients();
      const patient = patients.find(p => p.id === id);
      
      if (!patient) {
        return ResponseUtil.notFound('Patient', id);
      }

      return ResponseUtil.success('Patient retrieved successfully', patient);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve patient');
    }
  }

  /**
   * Create new patient
   * @param patientData Patient creation data
   * @returns Created patient data
   */
  async create(patientData: CreatePatientRequest) {
    try {
      const patients = this.loadPatients();
      
      // Check if email already exists
      const existingPatient = patients.find(p => p.email.toLowerCase() === patientData.email.toLowerCase());
      if (existingPatient) {
        return ResponseUtil.error('Email already exists');
      }

      // Check if phone already exists
      const existingPhone = patients.find(p => p.phone === patientData.phone);
      if (existingPhone) {
        return ResponseUtil.error('Phone number already exists');
      }

      // Honour a caller-supplied id (registration passes the id already stored on
      // the user account) and only generate one when creating a standalone record.
      const newPatientId = patientData.id || IdGenerator.generatePatientId();
      const currentYear = new Date().getFullYear();
      const randomNumber = Math.floor(Math.random() * 9000 + 1000);

      // Create new patient
      const newPatient: Patient = {
        id: newPatientId,
        fullName: patientData.fullName,
        phone: patientData.phone,
        email: patientData.email,
        patientIdDisplay: `PAT-${currentYear}-${randomNumber}`,
        memberSince: new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' }),
        status: 'Active',
        bloodGroup: patientData.bloodGroup || 'Unknown',
        age: patientData.age || 0,
        ...(patientData.city ? { city: patientData.city } : {}),
        ...(patientData.state ? { state: patientData.state } : {}),
        ...(patientData.pincode ? { pincode: patientData.pincode } : {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to patients array
      patients.push(newPatient);
      this.savePatients(patients);

      // Log activity
      this.systemService.createActivity({
        userId: newPatient.id,
        action: 'Create',
        details: `New patient record created for ${newPatient.fullName}`,
        module: 'Patients',
        severity: 'INFO'
      });

      return ResponseUtil.created('Patient created successfully', newPatient);
    } catch (error) {
      return ResponseUtil.serverError('Failed to create patient');
    }
  }

  /**
   * Update patient
   * @param id Patient ID
   * @param updateData Patient update data
   * @returns Updated patient data
   */
  async update(id: string, updateData: UpdatePatientRequest) {
    try {
      const patients = this.loadPatients();
      const patientIndex = patients.findIndex(p => p.id === id);
      
      if (patientIndex === -1) {
        return ResponseUtil.notFound('Patient', id);
      }

      // Check if email is being updated and already exists
      if (updateData.email) {
        const existing = patients.find(p => p.email.toLowerCase() === updateData.email.toLowerCase() && p.id !== id);
        if (existing) {
          return ResponseUtil.error('Email already exists');
        }
      }

      // Update patient
      patients[patientIndex] = {
        ...patients[patientIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      this.savePatients(patients);

      // Log activity
      this.systemService.createActivity({
        userId: 'Admin',
        action: 'Update',
        details: `Patient record ${id} (${patients[patientIndex].fullName}) updated`,
        module: 'Patients',
        severity: 'INFO'
      });

      return ResponseUtil.updated('Patient updated successfully', patients[patientIndex]);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update patient');
    }
  }

  /**
   * Delete patient
   * @param id Patient ID
   * @returns Deletion confirmation
   */
  async delete(id: string) {
    try {
      const patients = this.loadPatients();
      const patientIndex = patients.findIndex(p => p.id === id);
      
      if (patientIndex === -1) {
        return ResponseUtil.notFound('Patient', id);
      }

      const patient = patients[patientIndex];

      // Remove patient
      patients.splice(patientIndex, 1);
      this.savePatients(patients);

      // Log activity
      this.systemService.createActivity({
        userId: 'Admin',
        action: 'Delete',
        details: `Patient record ${id} (${patient.fullName}) deleted`,
        module: 'Patients',
        severity: 'WARNING'
      });

      return ResponseUtil.deleted('Patient');
    } catch (error) {
      return ResponseUtil.serverError('Failed to delete patient');
    }
  }

  /**
   * Get patient statistics
   * @returns Patient statistics
   */
  async getStats() {
    try {
      const patients = this.loadPatients();
      const totalPatients = patients.length;
      const activePatients = patients.filter(p => p.status === 'Active').length;
      const criticalPatients = patients.filter(p => p.status === 'Critical').length;

      // Calculate average age
      const totalAge = patients.reduce((sum, patient) => sum + patient.age, 0);
      const averageAge = totalPatients > 0 ? Math.round(totalAge / totalPatients) : 0;

      // Blood group distribution
      const bloodGroupDistribution: Record<string, number> = {};
      patients.forEach(patient => {
        bloodGroupDistribution[patient.bloodGroup] = (bloodGroupDistribution[patient.bloodGroup] || 0) + 1;
      });

      const stats: PatientStats = {
        total: totalPatients,
        active: activePatients,
        critical: criticalPatients,
        averageAge,
        bloodGroupDistribution
      };

      return ResponseUtil.success('Patient statistics retrieved successfully', stats);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve patient statistics');
    }
  }

  /**
   * Search patients by name, email, or patient ID
   * @param query Search query
   * @returns Matching patients
   */
  async search(query: string) {
    try {
      const patients = this.loadPatients();
      const searchTerm = query.toLowerCase();
      const matchingPatients = patients.filter(patient => 
        patient.fullName.toLowerCase().includes(searchTerm) ||
        patient.email.toLowerCase().includes(searchTerm) ||
        patient.patientIdDisplay.toLowerCase().includes(searchTerm) ||
        patient.phone.includes(searchTerm)
      );

      return ResponseUtil.success('Search results retrieved successfully', matchingPatients);
    } catch (error) {
      return ResponseUtil.serverError('Failed to search patients');
    }
  }

  /**
   * Get patients by blood group
   * @param bloodGroup Blood group
   * @returns Patients with specified blood group
   */
  async findByBloodGroup(bloodGroup: string) {
    try {
      const patients = this.loadPatients().filter(p => p.bloodGroup === bloodGroup);

      return ResponseUtil.success(`Patients with blood group '${bloodGroup}' retrieved successfully`, patients);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve patients by blood group');
    }
  }

  /**
   * Update patient status
   * @param id Patient ID
   * @param status New status
   * @returns Updated patient data
   */
  async updateStatus(id: string, status: string) {
    try {
      const patients = this.loadPatients();
      const updatedPatient = ArrayUtil.updateById(patients, id, {
        status,
        updatedAt: new Date().toISOString()
      });

      if (!updatedPatient) {
        return ResponseUtil.notFound('Patient', id);
      }

      this.savePatients(patients);

      return ResponseUtil.updated('Patient status updated successfully', updatedPatient);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update patient status');
    }
  }

  /**
   * Get patients by age range
   * @param minAge Minimum age
   * @param maxAge Maximum age
   * @returns Patients within age range
   */
  async findByAgeRange(minAge: number, maxAge: number) {
    try {
      const patients = this.loadPatients().filter(p => p.age >= minAge && p.age <= maxAge);
      
      return ResponseUtil.success(`Patients aged ${minAge}-${maxAge} retrieved successfully`, patients);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve patients by age range');
    }
  }
}
