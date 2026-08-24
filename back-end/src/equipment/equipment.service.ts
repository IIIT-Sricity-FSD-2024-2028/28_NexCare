import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
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
  private equipment: Equipment[] = [
    { id: 'EQ-001', name: 'MRI Scanner', type: 'Imaging', status: 'Active', hospitalId: 'H001' },
    { id: 'EQ-002', name: 'X-Ray Machine', type: 'Imaging', status: 'Maintenance', hospitalId: 'H001' }
  ];

  async findAll(hospitalId?: string) {
    try {
      let filtered = [...this.equipment];
      if (hospitalId) {
        filtered = filtered.filter(e => e.hospitalId === hospitalId);
      }
      return ResponseUtil.success('Equipment retrieved successfully', filtered);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve equipment');
    }
  }
}
