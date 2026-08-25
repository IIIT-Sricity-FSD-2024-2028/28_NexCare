import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { ArrayUtil } from '../common/utils/array.util';
import { FileStore } from '../common/utils/file-store.util';
import { Bed, CreateBedRequest, UpdateBedRequest, BedStats } from './interfaces/bed.interface';
import { BedStatus } from '../common/interfaces/api-response.interface';

/**
 * Beds Service
 * Manages hospital bed allocation and ward management in the NexCare system.
 * Data is persisted to data/beds.json so allocations survive restarts.
 */
@Injectable()
export class BedsService {
  private readonly store = new FileStore<Bed>('beds.json', () => BedsService.seed());

  private static seed(): Bed[] {
    const mk = (id: string, ward: string): Bed => ({
      id, ward, status: BedStatus.AVAILABLE, patient: '', hospitalId: 'H001',
    });
    return [
      mk('E1', 'Emergency'), mk('E2', 'Emergency'), mk('E3', 'Emergency'),
      mk('G1', 'General'), mk('G2', 'General'), mk('G3', 'General'), mk('G4', 'General'),
      mk('G5', 'General'), mk('G6', 'General'), mk('G7', 'General'), mk('G8', 'General'),
      mk('G9', 'General'), mk('G10', 'General'),
      mk('P1', 'Pediatrics'), mk('P2', 'Pediatrics'), mk('P3', 'Pediatrics'),
      mk('M1', 'Maternity'), mk('M2', 'Maternity'), mk('M3', 'Maternity'), mk('M4', 'Maternity'),
    ];
  }

  async findAll(ward?: string, status?: BedStatus, hospitalId?: string) {
    try {
      let filteredBeds = [...this.store.load()];
      if (hospitalId) filteredBeds = filteredBeds.filter(bed => bed.hospitalId === hospitalId);
      if (ward) filteredBeds = filteredBeds.filter(bed => bed.ward === ward);
      if (status) filteredBeds = filteredBeds.filter(bed => bed.status === status);
      return ResponseUtil.success('Beds retrieved successfully', filteredBeds);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve beds');
    }
  }

  async findById(id: string) {
    try {
      const bed = ArrayUtil.findById(this.store.load(), id);
      if (!bed) return ResponseUtil.notFound('Bed', id);
      return ResponseUtil.success('Bed retrieved successfully', bed);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve bed');
    }
  }

  async create(bedData: CreateBedRequest & { hospitalId?: string }) {
    try {
      const beds = this.store.load();
      if (beds.find(b => b.id === bedData.id)) {
        return ResponseUtil.error('Bed ID already exists');
      }

      const newBed: Bed = {
        id: bedData.id,
        ward: bedData.ward,
        status: BedStatus.AVAILABLE,
        patient: '',
        hospitalId: bedData.hospitalId || 'H001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      beds.push(newBed);
      this.store.save(beds);
      return ResponseUtil.created('Bed created successfully', newBed);
    } catch (error) {
      return ResponseUtil.serverError('Failed to create bed');
    }
  }

  async update(id: string, updateData: UpdateBedRequest) {
    try {
      const beds = this.store.load();
      const bedIndex = beds.findIndex(b => b.id === id);
      if (bedIndex === -1) return ResponseUtil.notFound('Bed', id);

      // Validate bed allocation logic
      if (updateData.patient && updateData.status !== BedStatus.OCCUPIED) {
        return ResponseUtil.error('Cannot assign patient to non-occupied bed');
      }
      if (updateData.status === BedStatus.OCCUPIED && !updateData.patient) {
        return ResponseUtil.error('Occupied bed must have assigned patient');
      }
      if (updateData.status === BedStatus.AVAILABLE && updateData.patient) {
        return ResponseUtil.error('Available bed cannot have assigned patient');
      }

      const updatedBed = { ...beds[bedIndex], ...updateData, updatedAt: new Date().toISOString() };
      beds[bedIndex] = updatedBed;
      this.store.save(beds);
      return ResponseUtil.updated('Bed updated successfully', updatedBed);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update bed');
    }
  }

  async delete(id: string) {
    try {
      const beds = this.store.load();
      const bedIndex = beds.findIndex(b => b.id === id);
      if (bedIndex === -1) return ResponseUtil.notFound('Bed', id);

      const bed = beds[bedIndex];
      if (bed.status === BedStatus.OCCUPIED || bed.status === BedStatus.CRITICAL) {
        return ResponseUtil.error('Cannot delete occupied or critical beds');
      }

      beds.splice(bedIndex, 1);
      this.store.save(beds);
      return ResponseUtil.deleted('Bed');
    } catch (error) {
      return ResponseUtil.serverError('Failed to delete bed');
    }
  }

  async allocate(id: string, patient: string) {
    try {
      const beds = this.store.load();
      const bedIndex = beds.findIndex(b => b.id === id);
      if (bedIndex === -1) return ResponseUtil.notFound('Bed', id);

      const bed = beds[bedIndex];
      if (bed.status !== BedStatus.AVAILABLE) {
        return ResponseUtil.error('Cannot allocate bed that is not available');
      }

      const existingAllocation = beds.find(b => b.patient && b.patient === patient);
      if (existingAllocation) {
        return ResponseUtil.error(`Patient ${patient} is already allocated to bed ${existingAllocation.id}`);
      }

      beds[bedIndex].status = BedStatus.OCCUPIED;
      beds[bedIndex].patient = patient;
      beds[bedIndex].updatedAt = new Date().toISOString();
      this.store.save(beds);
      return ResponseUtil.updated('Bed allocated successfully', beds[bedIndex]);
    } catch (error) {
      return ResponseUtil.serverError('Failed to allocate bed');
    }
  }

  async release(id: string) {
    try {
      const beds = this.store.load();
      const bedIndex = beds.findIndex(b => b.id === id);
      if (bedIndex === -1) return ResponseUtil.notFound('Bed', id);

      const bed = beds[bedIndex];
      if (bed.status !== BedStatus.OCCUPIED) {
        return ResponseUtil.error('Cannot release bed that is not occupied');
      }

      beds[bedIndex].status = BedStatus.AVAILABLE;
      beds[bedIndex].patient = '';
      beds[bedIndex].updatedAt = new Date().toISOString();
      this.store.save(beds);
      return ResponseUtil.updated('Bed released successfully', beds[bedIndex]);
    } catch (error) {
      return ResponseUtil.serverError('Failed to release bed');
    }
  }

  async getStats(hospitalId?: string) {
    try {
      let beds = this.store.load();
      if (hospitalId) beds = beds.filter(b => b.hospitalId === hospitalId);

      const totalBeds = beds.length;
      const availableBeds = beds.filter(b => b.status === BedStatus.AVAILABLE).length;
      const occupiedBeds = beds.filter(b => b.status === BedStatus.OCCUPIED).length;
      const criticalBeds = beds.filter(b => b.status === BedStatus.CRITICAL).length;
      const maintenanceBeds = beds.filter(b => b.status === BedStatus.MAINTENANCE).length;

      const byWard: Record<string, number> = {};
      beds.forEach(bed => { byWard[bed.ward] = (byWard[bed.ward] || 0) + 1; });

      const occupancyRate = totalBeds > 0 ? Math.round(((occupiedBeds + criticalBeds) / totalBeds) * 100) : 0;

      const stats: BedStats = {
        total: totalBeds,
        available: availableBeds,
        occupied: occupiedBeds,
        critical: criticalBeds,
        maintenance: maintenanceBeds,
        byWard,
        occupancyRate,
      };
      return ResponseUtil.success('Bed statistics retrieved successfully', stats);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve bed statistics');
    }
  }

  async findByWard(ward: string) {
    try {
      const beds = this.store.load().filter(b => b.ward === ward);
      return ResponseUtil.success(`Beds in ${ward} ward retrieved successfully`, beds);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve ward beds');
    }
  }

  async getAvailableBeds() {
    try {
      const availableBeds = this.store.load().filter(b => b.status === BedStatus.AVAILABLE);
      return ResponseUtil.success('Available beds retrieved successfully', availableBeds);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve available beds');
    }
  }

  async findByPatient(patient: string) {
    try {
      const beds = this.store.load().filter(b => b.patient === patient);
      return ResponseUtil.success(`Beds allocated to ${patient} retrieved successfully`, beds);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve patient bed allocation');
    }
  }

  async updateStatus(id: string, status: BedStatus) {
    try {
      const beds = this.store.load();
      const bedIndex = beds.findIndex(b => b.id === id);
      if (bedIndex === -1) return ResponseUtil.notFound('Bed', id);

      const currentBed = beds[bedIndex];
      if (status === BedStatus.AVAILABLE && currentBed.patient) {
        return ResponseUtil.error('Cannot set bed to available while patient is assigned');
      }
      if (status === BedStatus.CRITICAL && !currentBed.patient) {
        return ResponseUtil.error('Critical status requires patient assignment');
      }

      beds[bedIndex].status = status;
      beds[bedIndex].updatedAt = new Date().toISOString();
      this.store.save(beds);
      return ResponseUtil.updated('Bed status updated successfully', beds[bedIndex]);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update bed status');
    }
  }

  async getOccupancyByWard() {
    try {
      const beds = this.store.load();
      const wards = [...new Set(beds.map(b => b.ward))];
      const occupancyData: Record<string, { total: number; occupied: number; available: number; occupancyRate: number }> = {};

      wards.forEach(ward => {
        const wardBeds = beds.filter(b => b.ward === ward);
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
