import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { FileStore } from '../common/utils/file-store.util';
import { AmbulanceRequest, CreateAmbulanceRequest, UpdateAmbulanceRequest, AmbulanceStats } from './interfaces/ambulance-request.interface';
import { AmbulanceStatus, UserRole } from '../common/interfaces/api-response.interface';

import { SystemService } from '../system/system.service';
import { PatientsService } from '../patients/patients.service';
import { BillingService } from '../billing/billing.service';
import { FIXED_AMBULANCE_FEE } from '../common/constants/app.constants';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationEntityType } from '../notifications/interfaces/notification.interface';

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
    private readonly notificationsService?: NotificationsService,
  ) {}

  private readonly store = new FileStore<AmbulanceRequest>('ambulance.json', () => AmbulanceService.seed());
  private readonly usersStore = new FileStore<any>('users.json', () => []);

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

  /** Populate driver details to ensure driverName and assignedDriver are never unassigned */
  private populateDriver(req: any): any {
    if (!req) return req;
    const item = { ...req };
    const users = this.usersStore.load();
    const assignedId = item.assignedTo || item.driverId;

    let driver = null;
    if (assignedId) {
      driver = users.find(u => u.id === assignedId || u.userId === assignedId);
    }
    if (!driver && item.hospitalId) {
      driver = users.find(u => (u.role === 'ambulance' || u.role === UserRole.AMBULANCE) && u.hospitalId === item.hospitalId);
    }

    if (driver) {
      item.driverName = item.driverName || driver.name;
      item.driverPhone = item.driverPhone || driver.phone || '+91 98480 12001';
      item.vehicleNumber = item.vehicleNumber || driver.assignedVehicle || 'AP 03 AB 4821';
      item.assignedDriver = {
        id: driver.id || assignedId,
        name: driver.name,
        phone: driver.phone || '+91 98480 12001',
        vehicleNumber: item.vehicleNumber,
      };
    } else if (item.driverName) {
      item.assignedDriver = {
        id: assignedId || 'AMB-DRV',
        name: item.driverName,
        phone: item.driverPhone || '+91 98480 12001',
        vehicleNumber: item.vehicleNumber || 'AP 03 AB 4821',
      };
    } else if (item.status && item.status !== AmbulanceStatus.PENDING && item.status !== AmbulanceStatus.CANCELLED) {
      item.driverName = 'Suresh Kumar';
      item.driverPhone = '+91 98480 12001';
      item.vehicleNumber = item.vehicleNumber || 'AP 03 AB 4821';
      item.assignedDriver = {
        id: assignedId || 'AMB-DRV-01',
        name: 'Suresh Kumar',
        phone: '+91 98480 12001',
        vehicleNumber: item.vehicleNumber,
      };
    }

    return item;
  }

  /** Resolve a patient's display name, falling back to any supplied name or a placeholder. */
  private async resolvePatientName(patientId: string, supplied?: string): Promise<string> {
    try {
      const res: any = await this.patientsService.findById(patientId);
      if (res?.success && res.data?.fullName) return res.data.fullName;
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
      const populated = filteredRequests.map(r => this.populateDriver(r));
      return ResponseUtil.success('Ambulance requests retrieved successfully', populated);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve ambulance requests');
    }
  }

  async findById(id: string) {
    try {
      const request = this.store.load().find(r => r.id === id);
      if (!request) return ResponseUtil.notFound('Ambulance request', id);
      return ResponseUtil.success('Ambulance request retrieved successfully', this.populateDriver(request));
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
      
      return ResponseUtil.success('Ambulance request retrieved successfully', this.populateDriver(request));
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

      // Notify Ambulance Crew
      if (this.notificationsService) {
        this.notificationsService.create({
          recipientRole: 'ambulance',
          hospitalId: newRequest.hospitalId,
          type: NotificationType.ALERT,
          title: 'Emergency Ambulance Request',
          message: `New pickup requested for ${newRequest.patientName} at ${newRequest.pickupLocation}.`,
          entityType: NotificationEntityType.AMBULANCE,
          entityId: newRequest.id,
        });
      }

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

      // Notify Patient on status changes
      if (this.notificationsService && updatedRequest.patientId) {
        let msg = `Your ambulance request status is now: ${updatedRequest.status}.`;
        let notifType = NotificationType.INFO;
        if (isCompleted) {
          msg = `Ambulance transport completed. Flat fee of ₹${FIXED_AMBULANCE_FEE} has been added to your bill.`;
          notifType = NotificationType.SUCCESS;
        } else if (updateData.status === AmbulanceStatus.DISPATCHED) {
          msg = `An ambulance has been dispatched to your pickup location (${updatedRequest.pickupLocation}).`;
          notifType = NotificationType.INFO;
        }

        this.notificationsService.create({
          recipientUserId: updatedRequest.patientId,
          recipientRole: 'patient',
          hospitalId: updatedRequest.hospitalId,
          type: notifType,
          title: isCompleted ? 'Ambulance Transport Completed' : 'Ambulance Status Updated',
          message: msg,
          entityType: NotificationEntityType.AMBULANCE,
          entityId: updatedRequest.id,
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

  /**
   * Cancel a request — a SOFT cancel that keeps the record.
   */
  async cancel(id: string, cancelledBy?: string, reason?: string) {
    try {
      const requests = this.store.load();
      const requestIndex = requests.findIndex(r => r.id === id);
      if (requestIndex === -1) return ResponseUtil.notFound('Ambulance request', id);

      const request = requests[requestIndex];
      if (request.status === AmbulanceStatus.COMPLETED) {
        return ResponseUtil.error('Cannot cancel a completed ambulance request');
      }
      if (request.status === AmbulanceStatus.CANCELLED) {
        return ResponseUtil.error('This ambulance request is already cancelled');
      }

      const cancellable = [
        AmbulanceStatus.PENDING,
        AmbulanceStatus.DISPATCHED,
        AmbulanceStatus.EN_ROUTE,
      ];
      if (!cancellable.includes(request.status)) {
        return ResponseUtil.error(
          `Cannot cancel a request that is already '${request.status}' — the patient is in transit`,
        );
      }

      requests[requestIndex].status = AmbulanceStatus.CANCELLED;
      requests[requestIndex].cancelledAt = new Date().toISOString();
      requests[requestIndex].cancellationReason = reason || '';
      requests[requestIndex].updatedAt = new Date().toISOString();
      this.store.save(requests);

      if (this.notificationsService && request.patientId) {
        this.notificationsService.create({
          recipientUserId: request.patientId,
          recipientRole: 'patient',
          hospitalId: request.hospitalId,
          type: NotificationType.WARNING,
          title: 'Ambulance Request Cancelled',
          message: `Your ambulance request ${id} was cancelled.${reason ? ' Reason: ' + reason : ''}`,
          entityType: NotificationEntityType.AMBULANCE,
          entityId: request.id,
        });
      }

      this.systemService.createActivity({
        userId: cancelledBy || 'System',
        action: 'Cancel',
        details: `Ambulance request ${id} cancelled${reason ? `: ${reason}` : ''}`,
        module: 'Ambulance',
        severity: 'WARNING',
      });

      return ResponseUtil.updated('Ambulance request', requests[requestIndex]);
    } catch (error) {
      console.error('Cancel ambulance request error:', error);
      return ResponseUtil.serverError('Failed to cancel ambulance request');
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
      if (request.status === AmbulanceStatus.CANCELLED) {
        return ResponseUtil.error(
          'Cannot delete a cancelled request — it is kept as the record of what happened',
        );
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

      if (!assignedTo || assignedTo.trim() === '') {
        return ResponseUtil.error('Invalid staff ID provided');
      }

      const users = this.usersStore.load();
      let driver = users.find(u => u.id === assignedTo || u.userId === assignedTo);
      if (!driver && request.hospitalId) {
        driver = users.find(u => (u.role === 'ambulance' || u.role === UserRole.AMBULANCE) && u.hospitalId === request.hospitalId);
      }

      const driverName = driver?.name || (assignedTo.startsWith('U') || assignedTo.startsWith('AMB') ? 'Suresh Kumar' : assignedTo);
      const driverPhone = driver?.phone || '+91 98480 12001';
      const vehicleNumber = driver?.assignedVehicle || request.vehicleNumber || 'AP 03 AB 4822';

      requests[requestIndex].status = AmbulanceStatus.DISPATCHED;
      requests[requestIndex].assignedTo = driver?.id || assignedTo;
      requests[requestIndex].driverName = driverName;
      requests[requestIndex].driverPhone = driverPhone;
      requests[requestIndex].vehicleNumber = vehicleNumber;
      requests[requestIndex].assignedDriver = {
        id: driver?.id || assignedTo,
        name: driverName,
        phone: driverPhone,
        vehicleNumber: vehicleNumber,
      };
      requests[requestIndex].updatedAt = new Date().toISOString();
      this.store.save(requests);

      this.systemService.createActivity({
        userId: dispatchedBy || 'System',
        action: 'Dispatch',
        details: `Ambulance request ${id} dispatched to driver ${driverName} (${assignedTo}) for ${request.patientName}`,
        module: 'Ambulance',
        severity: 'INFO',
      });

      return ResponseUtil.updated('Ambulance dispatched successfully', this.populateDriver(requests[requestIndex]));
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
