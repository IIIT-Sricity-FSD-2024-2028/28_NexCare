import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { UserRole } from '../common/interfaces/api-response.interface';

export enum RequestPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum RequestStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED'
}

export interface SupportRequest {
  id: string;
  hospitalId: string;
  managerId?: string;
  createdBy: string;
  subject: string;
  message: string;
  priority: RequestPriority;
  status: RequestStatus;
  response?: string;
  createdAt: string;
}

export interface CreateRequestDto {
  subject: string;
  message: string;
  priority: RequestPriority;
}

@Injectable()
export class RequestsService {
  private readonly requestsFilePath = path.join(process.cwd(), 'data', 'requests.json');

  private get requests(): SupportRequest[] {
    try {
      const raw = fs.readFileSync(this.requestsFilePath, 'utf-8');
      return JSON.parse(raw) as SupportRequest[];
    } catch {
      return [];
    }
  }

  private set requests(val: SupportRequest[]) {
    try {
      fs.mkdirSync(path.dirname(this.requestsFilePath), { recursive: true });
      fs.writeFileSync(this.requestsFilePath, JSON.stringify(val, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist requests to disk:', err);
    }
  }

  async findAllForHospital(hospitalId: string) {
    try {
      const result = this.requests.filter(r => r.hospitalId === hospitalId);
      return ResponseUtil.success('Requests retrieved successfully', result);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve requests');
    }
  }

  async findAllForManager(managerId: string) {
    try {
      const result = this.requests.filter(r => r.managerId === managerId);
      return ResponseUtil.success('Requests retrieved successfully', result);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve requests');
    }
  }

  async create(hospitalId: string, createdBy: string, data: CreateRequestDto, managerId?: string) {
    try {
      const newRequest: SupportRequest = {
        ...data,
        id: IdGenerator.generate('REQ'),
        hospitalId,
        managerId,
        createdBy,
        status: RequestStatus.OPEN,
        createdAt: new Date().toISOString()
      };

      const all = this.requests;
      all.push(newRequest);
      this.requests = all;

      return ResponseUtil.created('Request submitted successfully', newRequest);
    } catch (error) {
      return ResponseUtil.serverError('Failed to submit request');
    }
  }

  async respond(id: string, responseMessage: string, status: RequestStatus) {
    try {
      const all = this.requests;
      const idx = all.findIndex(r => r.id === id);
      if (idx === -1) return ResponseUtil.notFound('Request', id);

      all[idx] = {
        ...all[idx],
        response: responseMessage,
        status
      };
      this.requests = all;

      return ResponseUtil.updated('Request updated successfully', all[idx]);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update request');
    }
  }
}
