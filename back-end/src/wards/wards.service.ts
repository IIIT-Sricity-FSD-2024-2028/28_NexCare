import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';

export interface Ward {
  id: string;
  name: string;
  hospitalId: string;
}

@Injectable()
export class WardsService {
  private wards: Ward[] = [
    { id: 'W-001', name: 'Emergency', hospitalId: 'H001' },
    { id: 'W-002', name: 'General', hospitalId: 'H001' }
  ];

  async findAll(hospitalId?: string) {
    try {
      let filtered = [...this.wards];
      if (hospitalId) {
        filtered = filtered.filter(w => w.hospitalId === hospitalId);
      }
      return ResponseUtil.success('Wards retrieved successfully', filtered);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve wards');
    }
  }
}
