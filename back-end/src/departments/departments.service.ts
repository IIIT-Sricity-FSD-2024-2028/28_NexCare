import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';

export interface Department {
  id: string;
  name: string;
  hospitalId: string;
}

@Injectable()
export class DepartmentsService {
  private departments: Department[] = [
    { id: 'D-001', name: 'Cardiology', hospitalId: 'H001' },
    { id: 'D-002', name: 'Neurology', hospitalId: 'H001' }
  ];

  async findAll(hospitalId?: string) {
    try {
      let filtered = [...this.departments];
      if (hospitalId) {
        filtered = filtered.filter(d => d.hospitalId === hospitalId);
      }
      return ResponseUtil.success('Departments retrieved successfully', filtered);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve departments');
    }
  }
}
