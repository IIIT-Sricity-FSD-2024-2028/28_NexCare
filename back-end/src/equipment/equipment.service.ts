import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { FileStore } from '../common/utils/file-store.util';
import { IdGenerator } from '../common/utils/id-generator.util';

export interface Equipment {
  id: string;
  name: string;
  type: string;
  status: string;
  hospitalId: string;
}

@Injectable()
export class EquipmentService {
  /** Persisted to data/equipment.json so edits survive a restart. */
  private readonly store = new FileStore<Equipment>('equipment.json', () => EquipmentService.seed());

  private static seed(): Equipment[] {
    return [
      { id: 'EQ-001', name: 'MRI Scanner', type: 'Imaging', status: 'Active', hospitalId: 'H001' },
      { id: 'EQ-002', name: 'X-Ray Machine', type: 'Imaging', status: 'Maintenance', hospitalId: 'H001' },
    ];
  }

  async findAll(hospitalId?: string) {
    try {
      let filtered = this.store.load();
      if (hospitalId) {
        filtered = filtered.filter(e => e.hospitalId === hospitalId);
      }
      return ResponseUtil.success('Equipment retrieved successfully', filtered);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve equipment');
    }
  }
}
