import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { ArrayUtil } from '../common/utils/array.util';
import { Bed, CreateBedRequest, UpdateBedRequest, BedStats } from './interfaces/bed.interface';
import { BedStatus } from '../common/interfaces/api-response.interface';

/**
 * Beds Service
 * Manages hospital bed allocation and ward management in the NexCare system
 * Handles CRUD operations for beds with occupancy tracking
 */
@Injectable()
export class BedsService {
  // In-memory mock beds database (aligned with frontend db.js)
  private beds: Bed[] = [
    { id: 'E1', ward: 'Emergency', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'E2', ward: 'Emergency', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'E3', ward: 'Emergency', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'G1', ward: 'General', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'G2', ward: 'General', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'G3', ward: 'General', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'G4', ward: 'General', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'G5', ward: 'General', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'G6', ward: 'General', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'G7', ward: 'General', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'G8', ward: 'General', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'G9', ward: 'General', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'G10', ward: 'General', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'P1', ward: 'Pediatrics', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'P2', ward: 'Pediatrics', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'P3', ward: 'Pediatrics', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'M1', ward: 'Maternity', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'M2', ward: 'Maternity', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'M3', ward: 'Maternity', status: BedStatus.AVAILABLE, patient: '' },
    { id: 'M4', ward: 'Maternity', status: BedStatus.AVAILABLE, patient: '' }
  ];

  /**
   * Get all beds with optional filtering
   * @param ward Optional ward filter
   * @param status Optional status filter
   * @returns List of beds
   */
  async findAll(ward?: string, status?: BedStatus) {
    try {
      let filteredBeds = [...this.beds];

      // Apply ward filter
      if (ward) {
        filteredBeds = filteredBeds.filter(bed => bed.ward === ward);
      }

      // Apply status filter
      if (status) {
        filteredBeds = filteredBeds.filter(bed => bed.status === status);
      }

      return ResponseUtil.success('Beds retrieved successfully', filteredBeds);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve beds');
    }
  }

  /**
   * Get bed by ID
   * @param id Bed ID
   * @returns Bed data
   */
  async findById(id: string) {
    try {
      const bed = ArrayUtil.findById(this.beds, id);
      
      if (!bed) {
        return ResponseUtil.notFound('Bed', id);
      }

      return ResponseUtil.success('Bed retrieved successfully', bed);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve bed');
    }
  }

  /**
   * Get the raw bed record without an API envelope.
   * Used by BedStatusChangeMiddleware, which needs the current status before
   * the request reaches the controller.
   * @param id Bed ID
   * @returns The bed, or undefined when no such bed exists
   */
  getBedById(id: string): Bed | undefined {
    return this.beds.find(b => b.id === id);
  }

  /**
   * Create new bed
   * @param bedData Bed creation data
   * @returns Created bed data
   */
  async create(bedData: CreateBedRequest) {
    try {
      // Check if bed ID already exists
      const existingBed = this.beds.find(b => b.id === bedData.id);
      if (existingBed) {
        return ResponseUtil.error('Bed ID already exists');
      }

      // Create new bed
      const newBed: Bed = {
        id: bedData.id,
        ward: bedData.ward,
        status: BedStatus.AVAILABLE,
        patient: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to beds array
      this.beds.push(newBed);

      return ResponseUtil.created('Bed created successfully', newBed);
    } catch (error) {
      return ResponseUtil.serverError('Failed to create bed');
    }
  }

  /**
   * Update bed
   * @param id Bed ID
   * @param updateData Bed update data
   * @returns Updated bed data
   */
  async update(id: string, updateData: UpdateBedRequest) {
    try {
      const bedIndex = this.beds.findIndex(b => b.id === id);
      
      if (bedIndex === -1) {
        return ResponseUtil.notFound('Bed', id);
      }

      // Validate bed allocation logic
      // A patient can be attached to a bed that is occupied or critical —
      // critical is an occupied bed whose patient needs intensive care.
      const patientStatuses: BedStatus[] = [BedStatus.OCCUPIED, BedStatus.CRITICAL];

      if (updateData.patient && !patientStatuses.includes(updateData.status as BedStatus)) {
        return ResponseUtil.error('Cannot assign patient to a bed that is not occupied or critical');
      }

      if (patientStatuses.includes(updateData.status as BedStatus) && !updateData.patient) {
        return ResponseUtil.error(`${updateData.status} bed must have an assigned patient`);
      }

      if (updateData.status === BedStatus.AVAILABLE && updateData.patient) {
        return ResponseUtil.error('Available bed cannot have assigned patient');
      }

      // Update bed
      const updatedBed = {
        ...this.beds[bedIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      this.beds[bedIndex] = updatedBed;

      return ResponseUtil.updated('Bed', updatedBed);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update bed');
    }
  }

  /**
   * Delete bed
   * @param id Bed ID
   * @returns Deletion confirmation
   */
  async delete(id: string) {
    try {
      const bedIndex = this.beds.findIndex(b => b.id === id);
      
      if (bedIndex === -1) {
        return ResponseUtil.notFound('Bed', id);
      }

      const bed = this.beds[bedIndex];

      // Prevent deletion of occupied beds
      if (bed.status === BedStatus.OCCUPIED || bed.status === BedStatus.CRITICAL) {
        return ResponseUtil.error('Cannot delete occupied or critical beds');
      }

      // Remove bed
      this.beds.splice(bedIndex, 1);

      return ResponseUtil.deleted('Bed');
    } catch (error) {
      return ResponseUtil.serverError('Failed to delete bed');
    }
  }

  /**
   * Allocate bed to patient
   * @param id Bed ID
   * @param patient Patient name
   * @returns Updated bed data
   */
  async allocate(id: string, patient: string) {
    try {
      const bedIndex = this.beds.findIndex(b => b.id === id);
      
      if (bedIndex === -1) {
        return ResponseUtil.notFound('Bed', id);
      }

      const bed = this.beds[bedIndex];

      // Check if bed is available
      if (bed.status !== BedStatus.AVAILABLE) {
        return ResponseUtil.error('Cannot allocate bed that is not available');
      }

      // Check if patient is already allocated
      const existingAllocation = this.beds.find(b => b.patient === patient);
      if (existingAllocation) {
        return ResponseUtil.error(`Patient ${patient} is already allocated to bed ${existingAllocation.id}`);
      }

      // Allocate bed
      this.beds[bedIndex].status = BedStatus.OCCUPIED;
      this.beds[bedIndex].patient = patient;
      this.beds[bedIndex].updatedAt = new Date().toISOString();

      const updatedBed = this.beds[bedIndex];

      return ResponseUtil.success('Bed allocated successfully', updatedBed);
    } catch (error) {
      return ResponseUtil.serverError('Failed to allocate bed');
    }
  }

  /**
   * Release bed from patient
   * @param id Bed ID
   * @returns Updated bed data
   */
  async release(id: string) {
    try {
      const bedIndex = this.beds.findIndex(b => b.id === id);
      
      if (bedIndex === -1) {
        return ResponseUtil.notFound('Bed', id);
      }

      const bed = this.beds[bedIndex];

      // Check if bed holds a patient (occupied or critical)
      if (bed.status !== BedStatus.OCCUPIED && bed.status !== BedStatus.CRITICAL) {
        return ResponseUtil.error('Cannot release bed that is not occupied');
      }

      // Release bed
      this.beds[bedIndex].status = BedStatus.AVAILABLE;
      this.beds[bedIndex].patient = '';
      this.beds[bedIndex].updatedAt = new Date().toISOString();

      const updatedBed = this.beds[bedIndex];

      return ResponseUtil.success('Bed released successfully', updatedBed);
    } catch (error) {
      return ResponseUtil.serverError('Failed to release bed');
    }
  }

  /**
   * Get bed statistics
   * @returns Bed statistics
   */
  async getStats() {
    try {
      const totalBeds = this.beds.length;
      const availableBeds = this.beds.filter(b => b.status === BedStatus.AVAILABLE).length;
      const occupiedBeds = this.beds.filter(b => b.status === BedStatus.OCCUPIED).length;
      const criticalBeds = this.beds.filter(b => b.status === BedStatus.CRITICAL).length;
      const maintenanceBeds = this.beds.filter(b => b.status === BedStatus.MAINTENANCE).length;

      // By ward
      const byWard: Record<string, number> = {};
      this.beds.forEach(bed => {
        byWard[bed.ward] = (byWard[bed.ward] || 0) + 1;
      });

      // Occupancy rate
      const occupancyRate = totalBeds > 0 ? Math.round(((occupiedBeds + criticalBeds) / totalBeds) * 100) : 0;

      const stats: BedStats = {
        total: totalBeds,
        available: availableBeds,
        occupied: occupiedBeds,
        critical: criticalBeds,
        maintenance: maintenanceBeds,
        byWard,
        occupancyRate
      };

      return ResponseUtil.success('Bed statistics retrieved successfully', stats);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve bed statistics');
    }
  }

  /**
   * Get beds by ward
   * @param ward Ward name
   * @returns Ward beds
   */
  async findByWard(ward: string) {
    try {
      const beds = this.beds.filter(b => b.ward === ward);
      
      return ResponseUtil.success(`Beds in ${ward} ward retrieved successfully`, beds);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve ward beds');
    }
  }

  /**
   * Get available beds
   * @returns Available beds
   */
  async getAvailableBeds() {
    try {
      const availableBeds = this.beds.filter(b => b.status === BedStatus.AVAILABLE);
      
      return ResponseUtil.success('Available beds retrieved successfully', availableBeds);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve available beds');
    }
  }

  /**
   * Get beds by patient
   * @param patient Patient name
   * @returns Patient bed allocation
   */
  async findByPatient(patient: string) {
    try {
      const beds = this.beds.filter(b => b.patient === patient);
      
      return ResponseUtil.success(`Beds allocated to ${patient} retrieved successfully`, beds);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve patient bed allocation');
    }
  }

  /**
   * Update bed status
   * @param id Bed ID
   * @param status New status
   * @returns Updated bed data
   */
  async updateStatus(id: string, status: BedStatus) {
    try {
      const bedIndex = this.beds.findIndex(b => b.id === id);
      
      if (bedIndex === -1) {
        return ResponseUtil.notFound('Bed', id);
      }

      // Validate status transition
      const currentBed = this.beds[bedIndex];
      if (status === BedStatus.AVAILABLE && currentBed.patient) {
        return ResponseUtil.error('Cannot set bed to available while patient is assigned');
      }

      if (status === BedStatus.CRITICAL && !currentBed.patient) {
        return ResponseUtil.error('Critical status requires patient assignment');
      }

      // Update status
      this.beds[bedIndex].status = status;
      this.beds[bedIndex].updatedAt = new Date().toISOString();

      const updatedBed = this.beds[bedIndex];

      return ResponseUtil.updated('Bed status', updatedBed);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update bed status');
    }
  }

  /**
   * Get occupancy by ward
   * @returns Occupancy data by ward
   */
  async getOccupancyByWard() {
    try {
      const wards = [...new Set(this.beds.map(b => b.ward))];
      const occupancyData: Record<string, { total: number; occupied: number; available: number; occupancyRate: number }> = {};

      wards.forEach(ward => {
        const wardBeds = this.beds.filter(b => b.ward === ward);
        const total = wardBeds.length;
        const occupied = wardBeds.filter(b => b.status === BedStatus.OCCUPIED || b.status === BedStatus.CRITICAL).length;
        const available = wardBeds.filter(b => b.status === BedStatus.AVAILABLE).length;
        const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

        occupancyData[ward] = { total, occupied, available, occupancyRate };
      });

      return ResponseUtil.success('Occupancy data by ward retrieved successfully', occupancyData);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve occupancy data');
    }
  }
}
