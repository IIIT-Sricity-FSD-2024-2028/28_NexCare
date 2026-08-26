import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { FileStore } from '../common/utils/file-store.util';

export interface Ward {
  id: string;
  name: string;
  hospitalId: string;
}

@Injectable()
export class WardsService {
  /** Persisted to data/wards.json so edits survive a restart. */
  private readonly store = new FileStore<Ward>('wards.json', () => WardsService.seed());

  private static seed(): Ward[] {
    return [
      { id: 'W-001', name: 'Emergency', hospitalId: 'H001' },
      { id: 'W-002', name: 'General', hospitalId: 'H001' },
    ];
  }

  async findAll(hospitalId?: string) {
    try {
      let filtered = this.store.load();
      if (hospitalId) {
        filtered = filtered.filter(w => w.hospitalId === hospitalId);
      }
      return ResponseUtil.success('Wards retrieved successfully', filtered);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve wards');
    }
  }
}
