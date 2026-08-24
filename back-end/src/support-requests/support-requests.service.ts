import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { SupportRequest, CreateSupportRequestDto, UpdateSupportRequestDto, SupportRequestStatus } from './interfaces/support-request.interface';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';

@Injectable()
export class SupportRequestsService {
  private readonly reqFilePath = path.join(process.cwd(), 'data', 'support-requests.json');

  private get requests(): SupportRequest[] {
    try {
      const raw = fs.readFileSync(this.reqFilePath, 'utf-8');
      return JSON.parse(raw) as SupportRequest[];
    } catch {
      return [];
    }
  }

  private set requests(val: SupportRequest[]) {
    try {
      fs.mkdirSync(path.dirname(this.reqFilePath), { recursive: true });
      fs.writeFileSync(this.reqFilePath, JSON.stringify(val, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist requests to disk:', err);
    }
  }

  async findAll(hospitalId?: string, managerId?: string) {
    try {
      let result = this.requests;
      if (hospitalId) result = result.filter(r => r.hospitalId === hospitalId);
      if (managerId) result = result.filter(r => r.assignedManagerId === managerId);
      return ResponseUtil.success('Support requests retrieved successfully', result);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve requests');
    }
  }

  async create(data: CreateSupportRequestDto, userId: string) {
    try {
      const newReq: SupportRequest = {
        ...data,
        id: IdGenerator.generate('SR-'),
        createdBy: userId,
        status: SupportRequestStatus.OPEN,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const all = this.requests;
      all.push(newReq);
      this.requests = all;

      return ResponseUtil.created('Support request created successfully', newReq);
    } catch (error) {
      return ResponseUtil.serverError('Failed to create support request');
    }
  }

  async update(id: string, updateData: UpdateSupportRequestDto) {
    try {
      const all = this.requests;
      const idx = all.findIndex(r => r.id === id);
      if (idx === -1) return ResponseUtil.notFound('Support Request', id);

      all[idx] = {
        ...all[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      this.requests = all;

      return ResponseUtil.updated('Support request updated successfully', all[idx]);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update support request');
    }
  }
}
