import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { FileStore } from '../common/utils/file-store.util';

export interface Department {
  id: string;
  name: string;
  hospitalId: string;
}

@Injectable()
export class DepartmentsService {
  /** Persisted to data/departments.json so edits survive a restart. */
  private readonly store = new FileStore<Department>('departments.json', () => DepartmentsService.seed());

  private static seed(): Department[] {
    return [
      { id: 'D-001', name: 'Cardiology', hospitalId: 'H001' },
      { id: 'D-002', name: 'Neurology', hospitalId: 'H001' },
    ];
  }

  async findAll(hospitalId?: string) {
    try {
      let filtered = this.store.load();
      if (hospitalId) {
        filtered = filtered.filter(d => d.hospitalId === hospitalId);
      }
      return ResponseUtil.success('Departments retrieved successfully', filtered);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve departments');
    }
  }
}
