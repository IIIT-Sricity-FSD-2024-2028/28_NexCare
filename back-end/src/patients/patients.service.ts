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

  // In-memory mock patients database (aligned with frontend db.js)
  private patients: Patient[] = [
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
    },
    {
      id: 'P003',
      fullName: 'Ravi Kumar',
      phone: '9876543210',
      email: 'ravi.kumar@example.com',
      patientIdDisplay: 'PAT-2026-003',
      memberSince: 'February 2026',
      status: 'Active',
      bloodGroup: 'B+',
      age: 28,
      createdAt: '2026-02-01T00:00:00Z'
    },
    {
      id: 'P004',
      fullName: 'Anita Sharma',
      phone: '8765432109',
      email: 'anita.sharma@example.com',
      patientIdDisplay: 'PAT-2026-004',
      memberSince: 'February 2026',
      status: 'Critical',
      bloodGroup: 'A-',
      age: 35,
      createdAt: '2026-02-01T00:00:00Z'
    },
    {
      id: 'P005',
      fullName: 'Priya Singh',
      phone: '7654321098',
      email: 'priya.singh@example.com',
      patientIdDisplay: 'PAT-2026-005',
      memberSince: 'February 2026',
      status: 'Active',
      bloodGroup: 'O-',
      age: 31,
      createdAt: '2026-02-01T00:00:00Z'
    },
    {
      id: 'P006',
      fullName: 'Amit Verma',
      phone: '6543210987',
      email: 'amit.verma@example.com',
      patientIdDisplay: 'PAT-2026-006',
      memberSince: 'February 2026',
      status: 'Active',
      bloodGroup: 'B-',
      age: 42,
      createdAt: '2026-02-01T00:00:00Z'
    },
    {
      id: 'P007',
      fullName: 'Kiran Rao',
      phone: '5432109876',
      email: 'kiran.rao@example.com',
      patientIdDisplay: 'PAT-2026-007',
      memberSince: 'February 2026',
      status: 'Active',
      bloodGroup: 'AB+',
      age: 29,
      createdAt: '2026-02-01T00:00:00Z'
    },
    {
      id: 'P008',
      fullName: 'Rahul Jain',
      phone: '4321098765',
      email: 'rahul.jain@example.com',
      patientIdDisplay: 'PAT-2026-008',
      memberSince: 'February 2026',
      status: 'Active',
      bloodGroup: 'A+',
      age: 38,
      createdAt: '2026-02-01T00:00:00Z'
    },
    {
      id: 'P009',
      fullName: 'Deepak Kumar',
      phone: '3210987654',
      email: 'deepak.kumar@example.com',
      patientIdDisplay: 'PAT-2026-009',
      memberSince: 'February 2026',
      status: 'Active',
      bloodGroup: 'O+',
      age: 47,
      createdAt: '2026-02-01T00:00:00Z'
    },
    {
      id: 'P010',
      fullName: 'Arjun Reddy',
      phone: '2109876543',
      email: 'arjun.reddy@example.com',
      patientIdDisplay: 'PAT-2026-010',
      memberSince: 'February 2026',
      status: 'Active',
      bloodGroup: 'B+',
      age: 33,
      createdAt: '2026-02-01T00:00:00Z'
    },
    {
      id: 'P011',
      fullName: 'Neha Gupta',
      phone: '1098765432',
      email: 'neha.gupta@example.com',
      patientIdDisplay: 'PAT-2026-011',
      memberSince: 'February 2026',
      status: 'Active',
      bloodGroup: 'A-',
      age: 26,
      createdAt: '2026-02-01T00:00:00Z'
    },
    {
      id: 'P012',
      fullName: 'Kid A',
      phone: '9999000001',
      email: 'kid.a@example.com',
      patientIdDisplay: 'PAT-2026-012',
      memberSince: 'February 2026',
      status: 'Active',
      bloodGroup: 'O+',
      age: 8,
      createdAt: '2026-02-01T00:00:00Z'
    },
    {
      id: 'P013',
      fullName: 'Mother A',
      phone: '9999000002',
      email: 'mother.a@example.com',
      patientIdDisplay: 'PAT-2026-013',
      memberSince: 'February 2026',
      status: 'Active',
      bloodGroup: 'B-',
      age: 30,
      createdAt: '2026-02-01T00:00:00Z'
    },
    {
      id: 'P014',
      fullName: 'Mother B',
      phone: '9999000003',
      email: 'mother.b@example.com',
      patientIdDisplay: 'PAT-2026-014',
      memberSince: 'February 2026',
      status: 'Active',
      bloodGroup: 'AB-',
      age: 34,
      createdAt: '2026-02-01T00:00:00Z'
    },
    {
      id: 'P015',
      fullName: 'John Doe',
      phone: '9999000004',
      email: 'johndoe@example.com',
      patientIdDisplay: 'PAT-2026-015',
      memberSince: 'January 2026',
      status: 'Active',
      bloodGroup: 'O+',
      age: 32,
      createdAt: '2026-01-01T00:00:00Z'
    }
  ];

  /**
   * Get all patients with optional filtering
   * @param status Optional status filter
   * @returns List of patients
   */
  async findAll(status?: string) {
    try {
      let filteredPatients = [...this.patients];

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
      const patient = ArrayUtil.findById(this.patients, id);
      
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
      // Check if email already exists
      const existingPatient = ArrayUtil.searchByText(this.patients, patientData.email, ['email']);
      if (existingPatient.length > 0) {
        return ResponseUtil.error('Email already exists');
      }

      // Check if phone already exists
      const existingPhone = ArrayUtil.searchByText(this.patients, patientData.phone, ['phone']);
      if (existingPhone.length > 0) {
        return ResponseUtil.error('Phone number already exists');
      }

      // Generate new patient ID and display ID
      const newPatientId = IdGenerator.generatePatientId();
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to patients array
      this.patients.push(newPatient);
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
      const patient = ArrayUtil.findById(this.patients, id);
      
      if (!patient) {
        return ResponseUtil.notFound('Patient', id);
      }

      // Check if email is being updated and already exists
      if (updateData.email) {
        const allPatientsWithEmail = ArrayUtil.searchByText(this.patients, updateData.email, ['email']);
        const existingPatient = allPatientsWithEmail.find(p => p.id !== id);
        if (existingPatient) {
          return ResponseUtil.error('Email already exists');
        }
      }

      // Check if phone is being updated and already exists
      if (updateData.phone) {
        const allPatientsWithPhone = ArrayUtil.searchByText(this.patients, updateData.phone, ['phone']);
        const existingPhone = allPatientsWithPhone.find(p => p.id !== id);
        if (existingPhone) {
          return ResponseUtil.error('Phone number already exists');
        }
      }

      // Update patient
      const updatedPatient = ArrayUtil.updateById(this.patients, id, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });

      if (!updatedPatient) {
        return ResponseUtil.notFound('Patient', id);
      }

      // Log activity
      this.systemService.createActivity({
        userId: 'Admin',
        action: 'Update',
        details: `Patient record ${id} (${updatedPatient.fullName}) updated`,
        module: 'Patients',
        severity: 'INFO'
      });

      return ResponseUtil.updated('Patient updated successfully', updatedPatient);
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
      const patient = ArrayUtil.findById(this.patients, id);
      
      if (!patient) {
        return ResponseUtil.notFound('Patient', id);
      }

      // Remove patient
      ArrayUtil.removeById(this.patients, id);

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
      const totalPatients = this.patients.length;
      const activePatients = this.patients.filter(p => p.status === 'Active').length;
      const criticalPatients = this.patients.filter(p => p.status === 'Critical').length;
      
      // Calculate average age
      const totalAge = this.patients.reduce((sum, patient) => sum + patient.age, 0);
      const averageAge = totalPatients > 0 ? Math.round(totalAge / totalPatients) : 0;

      // Blood group distribution
      const bloodGroupDistribution: Record<string, number> = {};
      this.patients.forEach(patient => {
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
      const searchTerm = query.toLowerCase();
      const matchingPatients = this.patients.filter(patient => 
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
      const patients = this.patients.filter(p => p.bloodGroup === bloodGroup);
      
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
      const updatedPatient = ArrayUtil.updateById(this.patients, id, {
        status,
        updatedAt: new Date().toISOString()
      });

      if (!updatedPatient) {
        return ResponseUtil.notFound('Patient', id);
      }

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
      const patients = this.patients.filter(p => p.age >= minAge && p.age <= maxAge);
      
      return ResponseUtil.success(`Patients aged ${minAge}-${maxAge} retrieved successfully`, patients);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve patients by age range');
    }
  }
}
