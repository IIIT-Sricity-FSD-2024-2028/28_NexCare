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

  private readonly hospitalsStore = new FileStore<any>('hospitals.json', () => []);

  /** Statuses in which a crew is out on a job and cannot take another. */
  static readonly ACTIVE_STATUSES: AmbulanceStatus[] = [
    AmbulanceStatus.DISPATCHED, AmbulanceStatus.EN_ROUTE, AmbulanceStatus.PICKED_UP, AmbulanceStatus.AT_HOSPITAL,
  ];

  private static isCrew(u: any): boolean {
    return u?.role === UserRole.AMBULANCE;
  }

  /**
   * A hospital's ambulance fleet. One ambulance-crew login is one ambulance:
   * the account carries the vehicle (assignedVehicle) and the person driving
   * it (driverName, or the account name for crews registered by a manager).
   */
  private crewsOf(hospitalId: string, users = this.usersStore.load()): any[] {
    return users.filter(u => AmbulanceService.isCrew(u) && u.hospitalId === hospitalId);
  }

  private static driverNameOf(crew: any): string {
    return crew.driverName || crew.name;
  }

  /** The driver fields a request carries once a crew has taken it. */
  private static driverFields(crew: any) {
    const name = AmbulanceService.driverNameOf(crew);
    return {
      assignedTo: crew.id,
      driverName: name,
      driverPhone: crew.phone || '',
      vehicleNumber: crew.assignedVehicle,
      assignedDriver: { id: crew.id, name, phone: crew.phone || '', vehicleNumber: crew.assignedVehicle, unit: crew.name },
    };
  }

  /**
   * Attach the assigned crew's live details. A request nobody has taken has
   * no driver: nothing is invented for it.
   */
  private populateDriver(req: any): any {
    if (!req) return req;
    const item = { ...req };
    if (!item.assignedTo) return item;
    const crew = this.usersStore.load().find(u => u.id === item.assignedTo && AmbulanceService.isCrew(u));
    if (crew) {
      const fields = AmbulanceService.driverFields(crew);
      // The vehicle that ran the job is history: keep what was recorded.
      item.vehicleNumber = item.vehicleNumber || fields.vehicleNumber;
      item.driverName = item.driverName || fields.driverName;
      item.driverPhone = item.driverPhone || fields.driverPhone;
      item.assignedDriver = { ...fields.assignedDriver, vehicleNumber: item.vehicleNumber };
    } else if (item.driverName) {
      item.assignedDriver = { id: item.assignedTo, name: item.driverName, phone: item.driverPhone || '', vehicleNumber: item.vehicleNumber };
    }
    return item;
  }

  /**
   * Fleet status per hospital: every crew/vehicle, whether it is free or out
   * on a job, and how many requests are still waiting for a crew.
   * `withCrews: false` returns counts only (what a patient is shown).
   */
  fleet(hospitalId?: string, withCrews = true) {
    try {
      const users = this.usersStore.load();
      const requests = this.store.load();
      const hospitals = this.hospitalsStore.load()
        .filter(h => !hospitalId || h.id === hospitalId);
      if (hospitalId && hospitals.length === 0) return ResponseUtil.notFound('Hospital', hospitalId);

      const rows = hospitals.map(h => {
        const crews = this.crewsOf(h.id, users).map(c => {
          const job = requests.find(r => r.assignedTo === c.id && AmbulanceService.ACTIVE_STATUSES.includes(r.status));
          const onDuty = String(c.status || 'Active') === 'Active';
          const status = !onDuty ? 'off_duty' : job ? 'on_transport' : c.assignedVehicle ? 'available' : 'no_vehicle';
          return {
            id: c.id, unit: c.name, driverName: AmbulanceService.driverNameOf(c), phone: c.phone || '',
            vehicleNumber: c.assignedVehicle || null, status,
            currentRequest: job ? { id: job.id, status: job.status, patientName: job.patientName, pickupLocation: job.pickupLocation } : null,
          };
        });
        const count = (st: string) => crews.filter(c => c.status === st).length;
        const row: any = {
          hospitalId: h.id,
          hospitalName: h.name,
          ambulanceService: h.ambulanceService !== false && crews.length > 0,
          total: crews.length,
          available: count('available'),
          onTransport: count('on_transport'),
          unavailable: count('off_duty') + count('no_vehicle'),
          waiting: requests.filter(r => r.hospitalId === h.id && r.status === AmbulanceStatus.PENDING).length,
        };
        if (withCrews) row.crews = crews;
        return row;
      });
      return ResponseUtil.success('Ambulance fleet retrieved successfully', hospitalId ? rows[0] : rows);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve the ambulance fleet');
    }
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
      const hospital = this.hospitalsStore.load().find(h => h.id === requestData.hospitalId);
      if (!hospital) return ResponseUtil.notFound('Hospital', requestData.hospitalId);
      if ((hospital.verificationStatus || 'verified') !== 'verified') {
        return ResponseUtil.error(`${hospital.name} is not verified yet and cannot take ambulance requests`);
      }
      if (hospital.ambulanceService === false || this.crewsOf(hospital.id).length === 0) {
        return ResponseUtil.error(`${hospital.name} has no ambulance service. Please choose another hospital.`);
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

      const current = requests[requestIndex];
      // Who drives and in which vehicle is decided by dispatch() from the
      // crew's account; an edit cannot rewrite it or move the request.
      const { assignedTo, vehicleNumber, driverName, driverPhone, hospitalId, ...changes } = updateData as any;
      const stillUnassigned = !current.assignedTo;
      if (changes.status && stillUnassigned && AmbulanceService.ACTIVE_STATUSES.includes(changes.status)) {
        return ResponseUtil.error('Assign an ambulance crew (dispatch) before moving this request to ' + changes.status);
      }
      if (changes.status && !Object.values(AmbulanceStatus).includes(changes.status)) {
        return ResponseUtil.error(`'${changes.status}' is not a request status`);
      }
      const updatedRequest: any = { ...current, ...changes, updatedAt: new Date().toISOString() };
      // "Cancel assignment": the crew hands a dispatched request back. It waits
      // for any crew again, so it carries no driver or vehicle any more.
      const handedBack = changes.status === AmbulanceStatus.PENDING && current.status !== AmbulanceStatus.PENDING;
      if (handedBack) {
        if (current.status !== AmbulanceStatus.DISPATCHED) {
          return ResponseUtil.error(`A '${current.status}' request cannot be handed back to the queue`);
        }
        for (const field of ['assignedTo', 'driverName', 'driverPhone', 'vehicleNumber', 'assignedDriver', 'dispatchedAt']) {
          delete updatedRequest[field];
        }
      }
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

  /**
   * Hand a pending request to one crew (= one ambulance) of the SAME hospital.
   * The vehicle and driver come from that crew's account, never from the
   * caller, and a crew already out on a job cannot take a second one.
   */
  async dispatch(id: string, assignedTo?: string, dispatchedBy?: string) {
    try {
      const requests = this.store.load();
      const requestIndex = requests.findIndex(r => r.id === id);
      if (requestIndex === -1) return ResponseUtil.notFound('Ambulance request', id);

      const request = requests[requestIndex];
      if (request.status !== AmbulanceStatus.PENDING) {
        return ResponseUtil.error('Cannot dispatch request that is not pending');
      }
      if (!assignedTo || assignedTo.trim() === '') {
        return ResponseUtil.error('Assigned staff ID is required for dispatch');
      }

      const crew = this.usersStore.load().find(u => u.id === assignedTo.trim() && AmbulanceService.isCrew(u));
      if (!crew) {
        return ResponseUtil.error(`${assignedTo} is not an ambulance crew account`);
      }
      if (crew.hospitalId !== request.hospitalId) {
        return ResponseUtil.error(`${crew.name} belongs to another hospital and cannot take a ${request.hospitalId} request`);
      }
      if (String(crew.status || 'Active') !== 'Active') {
        return ResponseUtil.error(`${crew.name} is not on duty`);
      }
      if (!crew.assignedVehicle) {
        return ResponseUtil.error(`${crew.name} has no vehicle assigned. Ask the hospital manager to assign one.`);
      }
      const current = requests.find(r => r.assignedTo === crew.id && AmbulanceService.ACTIVE_STATUSES.includes(r.status));
      if (current) {
        return ResponseUtil.error(`${crew.name} (${crew.assignedVehicle}) is already on transport ${current.id}`);
      }

      const fields = AmbulanceService.driverFields(crew);
      Object.assign(requests[requestIndex], fields, {
        status: AmbulanceStatus.DISPATCHED,
        dispatchedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      this.store.save(requests);

      if (this.notificationsService && request.patientId) {
        this.notificationsService.create({
          recipientUserId: request.patientId,
          recipientRole: 'patient',
          hospitalId: request.hospitalId,
          type: NotificationType.INFO,
          title: 'Ambulance Dispatched',
          message: `${fields.driverName} is on the way in ambulance ${fields.vehicleNumber} (${fields.driverPhone}).`,
          entityType: NotificationEntityType.AMBULANCE,
          entityId: request.id,
        });
      }

      this.systemService.createActivity({
        userId: dispatchedBy || 'System',
        action: 'Dispatch',
        details: `Ambulance request ${id} dispatched to ${crew.name} — ${fields.driverName}, ${fields.vehicleNumber} — for ${request.patientName}`,
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

      if (!requests[requestIndex].assignedTo && AmbulanceService.ACTIVE_STATUSES.includes(status)) {
        return ResponseUtil.error('Assign an ambulance crew (dispatch) before moving this request to ' + status);
      }
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
      return ResponseUtil.success(`Ambulance requests for patient ${patientId} retrieved successfully`, requests.map(r => this.populateDriver(r)));
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
      return ResponseUtil.success(`Ambulance requests assigned to ${assignedTo} retrieved successfully`, requests.map(r => this.populateDriver(r)));
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve assigned ambulance requests');
    }
  }

  private isValidStatusTransition(currentStatus: any, newStatus: any): boolean {
    return true;
  }
}
