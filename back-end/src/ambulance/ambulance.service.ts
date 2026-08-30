import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { FileStore } from '../common/utils/file-store.util';
import { AmbulanceRequest, CreateAmbulanceRequest, UpdateAmbulanceRequest, AmbulanceStats } from './interfaces/ambulance-request.interface';
import { AmbulanceStatus } from '../common/interfaces/api-response.interface';

import { SystemService } from '../system/system.service';
import { PatientsService } from '../patients/patients.service';
import { BillingService } from '../billing/billing.service';
import { FIXED_AMBULANCE_FEE } from '../common/constants/app.constants';

/**
 * Ambulance Service
 * Manages emergency services and ambulance requests in the NexCare system.
 * Data is persisted to data/ambulance.json so requests survive restarts.
 */
@Injectable()
export class AmbulanceService {
  constructor(
    private readonly systemService: SystemService,
    private readonly patientsService: PatientsService,
    private readonly billingService: BillingService,
  ) {}

  private readonly store = new FileStore<AmbulanceRequest>('ambulance.json', () => AmbulanceService.seed());

  private static seed(): AmbulanceRequest[] {
    return [
      {
        id: 'AMB-001', patientId: 'P002', patientName: 'Maria Garcia',
        pickupLocation: '742 Evergreen Terrace, Springfield', contact: '+1 (555) 987-6543',
        notes: 'Patient is experiencing severe chest pains and shortness of breath.',
        status: AmbulanceStatus.DISPATCHED, assignedTo: 'U003',
        createdAt: '2026-04-02T10:15:00Z', updatedAt: '2026-04-02T10:20:00Z', hospitalId: 'H001',
      },
      {
        id: 'AMB-002', patientId: 'P001', patientName: 'John Anderson',
        pickupLocation: '123 Main Street, Downtown', contact: '+1 (555) 123-4567',
        notes: 'Mild concussion from a fall.',
        status: AmbulanceStatus.COMPLETED, assignedTo: 'U003',
        createdAt: '2026-03-25T14:20:00Z', updatedAt: '2026-03-25T16:45:00Z', hospitalId: 'H001',
      },
    ];
  }

  /** Resolve a patient's display name, falling back to any supplied name or a placeholder. */
  private async resolvePatientName(patientId: string, supplied?: string): Promise<string> {
    try {
      const res: any = await this.patientsService.findById(patientId);
      if (res?.success && res.data?.fullName) return res.data.fullName;
      // Log warning if patient not found but we have a supplied name
      if (supplied) {
        console.warn(`Patient ${patientId} not found in database, using supplied name: ${supplied}`);
      } else {
        console.error(`Patient ${patientId} not found in database and no supplied name provided`);
      }
    } catch (error) {
      console.error(`Error resolving patient name for ${patientId}:`, error);
    }
    return supplied || `Patient ${patientId}`;
  }

  async findAll(patientId?: string, status?: AmbulanceStatus, hospitalId?: string) {
    try {
      let filteredRequests = [...this.store.load()];
      if (hospitalId) filteredRequests = filteredRequests.filter(req => req.hospitalId === hospitalId);
      if (patientId) filteredRequests = filteredRequests.filter(req => req.patientId === patientId);
      if (status) filteredRequests = filteredRequests.filter(req => req.status === status);
      return ResponseUtil.success('Ambulance requests retrieved successfully', filteredRequests);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve ambulance requests');
    }
  }

  async findById(id: string) {
    try {
      const request = this.store.load().find(r => r.id === id);
      if (!request) return ResponseUtil.notFound('Ambulance request', id);
      return ResponseUtil.success('Ambulance request retrieved successfully', request);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve ambulance request');
    }
  }

  async findByIdWithAccessCheck(id: string, userHospitalId?: string) {
    try {
      const request = this.store.load().find(r => r.id === id);
      if (!request) return ResponseUtil.notFound('Ambulance request', id);
      
      // If userHospitalId is provided, validate access
      if (userHospitalId && request.hospitalId !== userHospitalId) {
        return ResponseUtil.error('You do not have access to this ambulance request');
      }
      
      return ResponseUtil.success('Ambulance request retrieved successfully', request);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve ambulance request');
    }
  }

  async create(requestData: CreateAmbulanceRequest & { hospitalId?: string }) {
    try {
      const requests = this.store.load();

      // Check for duplicate active request for same patient
      const duplicateRequest = requests.find(r =>
        r.patientId === requestData.patientId &&
        r.status !== AmbulanceStatus.COMPLETED &&
        r.status !== AmbulanceStatus.CANCELLED
      );
      if (duplicateRequest) {
        return ResponseUtil.error('Patient already has an active ambulance request');
      }

      const newRequestId = IdGenerator.generateAmbulanceId();
      const patientName = await this.resolvePatientName(requestData.patientId, requestData.patientName);

      if (!requestData.hospitalId) {
        return ResponseUtil.error('Hospital ID is required for ambulance request');
      }

      const newRequest: AmbulanceRequest = {
        id: newRequestId,
        patientId: requestData.patientId,
        patientName,
        pickupLocation: requestData.pickupLocation,
        contact: requestData.contact,
        notes: requestData.notes || '',
        status: AmbulanceStatus.PENDING,
        hospitalId: requestData.hospitalId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      requests.push(newRequest);
      this.store.save(requests);

      this.systemService.createActivity({
        userId: requestData.patientId,
        action: 'Create',
        details: `Ambulance request ${newRequestId} created for ${newRequest.patientName}`,
        module: 'Ambulance',
        severity: 'INFO',
      });

      return ResponseUtil.created('Ambulance request created successfully', newRequest);
    } catch (error) {
      return ResponseUtil.serverError('Failed to create ambulance request');
    }
  }

  async update(id: string, updateData: UpdateAmbulanceRequest) {
    try {
      const requests = this.store.load();
      const requestIndex = requests.findIndex(r => r.id === id);
      if (requestIndex === -1) return ResponseUtil.notFound('Ambulance request', id);

      const updatedRequest = { ...requests[requestIndex], ...updateData, updatedAt: new Date().toISOString() };
      requests[requestIndex] = updatedRequest;
      this.store.save(requests);

      const isCompleted = updateData.status === AmbulanceStatus.COMPLETED;

      if (isCompleted && updatedRequest.patientId) {
        this.billingService.addChargeToPendingBill(updatedRequest.patientId, {
          type: 'AMBULANCE',
          description: 'Ambulance Transport',
          amount: FIXED_AMBULANCE_FEE,
          referenceId: updatedRequest.id,
          department: 'Emergency Transport',
        });
      }

      this.systemService.createActivity({
        userId: updatedRequest.assignedTo || 'System',
        action: isCompleted ? 'Complete' : 'Update',
        details: isCompleted
          ? `Ambulance transport ${id} completed for ${updatedRequest.patientName}`
          : `Ambulance request ${id} updated to ${updatedRequest.status}`,
        module: 'Ambulance',
        severity: isCompleted ? 'SUCCESS' : 'INFO',
      });

      return ResponseUtil.updated('Ambulance request updated successfully', updatedRequest);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update ambulance request');
    }
  }

  async delete(id: string) {
    try {
      const requests = this.store.load();
      const requestIndex = requests.findIndex(r => r.id === id);
      if (requestIndex === -1) return ResponseUtil.notFound('Ambulance request', id);

      const request = requests[requestIndex];
      if (request.status === AmbulanceStatus.COMPLETED) {
        return ResponseUtil.error('Cannot delete completed ambulance requests');
      }

      requests.splice(requestIndex, 1);
      this.store.save(requests);

      this.systemService.createActivity({
        userId: 'Admin',
        action: 'Delete',
        details: `Ambulance request ${id} deleted`,
        module: 'Ambulance',
        severity: 'WARNING',
      });

      return ResponseUtil.success('Ambulance request deleted successfully');
    } catch (error) {
      return ResponseUtil.serverError('Failed to delete ambulance request');
    }
  }

  async dispatch(id: string, assignedTo?: string, dispatchedBy?: string) {
    try {
      const requests = this.store.load();
      const requestIndex = requests.findIndex(r => r.id === id);
      if (requestIndex === -1) return ResponseUtil.notFound('Ambulance request', id);

      const request = requests[requestIndex];
      if (request.status !== AmbulanceStatus.PENDING) {
        return ResponseUtil.error('Cannot dispatch request that is not pending');
      }

      if (!assignedTo) {
        return ResponseUtil.error('Assigned staff ID is required for dispatch');
      }

      // Validate staff exists and is active (basic check - would need UsersService injection for full validation)
      // For now, we'll do a basic non-empty check
      if (!assignedTo || assignedTo.trim() === '') {
        return ResponseUtil.error('Invalid staff ID provided');
      }

      requests[requestIndex].status = AmbulanceStatus.DISPATCHED;
      requests[requestIndex].assignedTo = assignedTo;
      requests[requestIndex].updatedAt = new Date().toISOString();
      this.store.save(requests);

      this.systemService.createActivity({
        userId: dispatchedBy || 'System',
        action: 'Dispatch',
        details: `Ambulance request ${id} dispatched to staff ${assignedTo} for ${request.patientName}`,
        module: 'Ambulance',
        severity: 'INFO',
      });

      return ResponseUtil.updated('Ambulance dispatched successfully', requests[requestIndex]);
    } catch (error) {
      return ResponseUtil.serverError('Failed to dispatch ambulance');
    }
  }

  async complete(id: string) {
    try {
      const requests = this.store.load();
      const requestIndex = requests.findIndex(r => r.id === id);
      if (requestIndex === -1) return ResponseUtil.notFound('Ambulance request', id);

      const request = requests[requestIndex];
      // Allow completion from any active status (dispatched, en_route, picked_up, at_hospital)
      const activeStatuses = [AmbulanceStatus.DISPATCHED, AmbulanceStatus.EN_ROUTE, AmbulanceStatus.PICKED_UP, AmbulanceStatus.AT_HOSPITAL];
      if (!activeStatuses.includes(request.status)) {
        return ResponseUtil.error('Cannot complete request that is not in active transport');
      }

      requests[requestIndex].status = AmbulanceStatus.COMPLETED;
      requests[requestIndex].updatedAt = new Date().toISOString();
      this.store.save(requests);

      const completedReq = requests[requestIndex];
      if (completedReq.patientId) {
        this.billingService.addChargeToPendingBill(completedReq.patientId, {
          type: 'AMBULANCE',
          description: 'Ambulance Transport',
          amount: FIXED_AMBULANCE_FEE,
          referenceId: completedReq.id,
          department: 'Emergency Transport',
        });
      }

      this.systemService.createActivity({
        userId: completedReq.assignedTo || 'System',
        action: 'Complete',
        details: `Ambulance transport ${id} completed for ${completedReq.patientName}`,
        module: 'Ambulance',
        severity: 'SUCCESS',
      });

      return ResponseUtil.updated('Ambulance request completed successfully', requests[requestIndex]);
    } catch (error) {
      return ResponseUtil.serverError('Failed to complete ambulance request');
    }
  }

  async updateStatus(id: string, status: AmbulanceStatus) {
    try {
      const requests = this.store.load();
      const requestIndex = requests.findIndex(r => r.id === id);
      if (requestIndex === -1) return ResponseUtil.notFound('Ambulance request', id);

      if (!this.isValidStatusTransition(requests[requestIndex].status, status)) {
        return ResponseUtil.error(`Invalid status transition from ${requests[requestIndex].status} to ${status}`);
      }

      requests[requestIndex].status = status;
      requests[requestIndex].updatedAt = new Date().toISOString();
      this.store.save(requests);

      if (status === AmbulanceStatus.COMPLETED && requests[requestIndex].patientId) {
        const completedReq = requests[requestIndex];
        this.billingService.addChargeToPendingBill(completedReq.patientId, {
          type: 'AMBULANCE',
          description: 'Ambulance Transport',
          amount: FIXED_AMBULANCE_FEE,
          referenceId: completedReq.id,
          department: 'Emergency Transport',
        });
      }

      return ResponseUtil.updated('Request status updated successfully', requests[requestIndex]);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update request status');
    }
  }

  async getStats(hospitalId?: string) {
    try {
      let requests = this.store.load();
      if (hospitalId) {
        requests = requests.filter(r => r.hospitalId === hospitalId);
      }
      const count = (s: AmbulanceStatus) => requests.filter(r => r.status === s).length;

      const byStatus: Record<AmbulanceStatus, number> = {
        [AmbulanceStatus.PENDING]: count(AmbulanceStatus.PENDING),
        [AmbulanceStatus.DISPATCHED]: count(AmbulanceStatus.DISPATCHED),
        [AmbulanceStatus.EN_ROUTE]: count(AmbulanceStatus.EN_ROUTE),
        [AmbulanceStatus.PICKED_UP]: count(AmbulanceStatus.PICKED_UP),
        [AmbulanceStatus.AT_HOSPITAL]: count(AmbulanceStatus.AT_HOSPITAL),
        [AmbulanceStatus.COMPLETED]: count(AmbulanceStatus.COMPLETED),
        [AmbulanceStatus.CANCELLED]: count(AmbulanceStatus.CANCELLED),
      };

      // Calculate actual average response time (from creation to dispatch)
      const dispatchedRequests = requests.filter(r => r.status !== AmbulanceStatus.PENDING && r.createdAt);
      let totalResponseTime = 0;
      let responseTimeCount = 0;

      dispatchedRequests.forEach(req => {
        if (req.createdAt) {
          const created = new Date(req.createdAt).getTime();
          // Use updatedAt as proxy for dispatch time if no specific dispatch timestamp
          const dispatched = req.updatedAt ? new Date(req.updatedAt).getTime() : Date.now();
          const responseMinutes = (dispatched - created) / (1000 * 60);
          if (responseMinutes > 0 && responseMinutes < 1440) { // Only count reasonable times (< 24 hours)
            totalResponseTime += responseMinutes;
            responseTimeCount++;
          }
        }
      });

      const averageResponseTime = responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0;

      const stats: AmbulanceStats = {
        total: requests.length,
        pending: byStatus[AmbulanceStatus.PENDING],
        dispatched: byStatus[AmbulanceStatus.DISPATCHED],
        enRoute: byStatus[AmbulanceStatus.EN_ROUTE],
        pickedUp: byStatus[AmbulanceStatus.PICKED_UP],
        atHospital: byStatus[AmbulanceStatus.AT_HOSPITAL],
        completed: byStatus[AmbulanceStatus.COMPLETED],
        averageResponseTime,
        byStatus,
      };
      return ResponseUtil.success('Ambulance statistics retrieved successfully', stats);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve ambulance statistics');
    }
  }

  async findByPatient(patientId: string) {
    try {
      const requests = this.store.load().filter(r => r.patientId === patientId);
      return ResponseUtil.success(`Ambulance requests for patient ${patientId} retrieved successfully`, requests);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve patient ambulance requests');
    }
  }

  async getActiveRequests(hospitalId?: string) {
    try {
      let requests = this.store.load().filter(r => r.status !== AmbulanceStatus.COMPLETED);
      if (hospitalId) {
        requests = requests.filter(r => r.hospitalId === hospitalId);
      }
      return ResponseUtil.success('Active ambulance requests retrieved successfully', requests);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve active ambulance requests');
    }
  }

  async findByAssignedStaff(assignedTo: string, hospitalId?: string) {
    try {
      let requests = this.store.load().filter(r => r.assignedTo === assignedTo);
      // Apply hospital scoping for non-superuser access
      if (hospitalId) {
        requests = requests.filter(r => r.hospitalId === hospitalId);
      }
      return ResponseUtil.success(`Ambulance requests assigned to ${assignedTo} retrieved successfully`, requests);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve assigned ambulance requests');
    }
  }

  private isValidStatusTransition(currentStatus: any, newStatus: any): boolean {
    return true;
  }
}
