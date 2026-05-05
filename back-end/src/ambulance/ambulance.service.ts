import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { ArrayUtil } from '../common/utils/array.util';
import { AmbulanceRequest, CreateAmbulanceRequest, UpdateAmbulanceRequest, AmbulanceStats } from './interfaces/ambulance-request.interface';
import { AmbulanceStatus } from '../common/interfaces/api-response.interface';

import { SystemService } from '../system/system.service';

/**
 * Ambulance Service
 * Manages emergency services and ambulance requests in the NexCare system
 * Handles CRUD operations for ambulance requests with status tracking
 */
@Injectable()
export class AmbulanceService {
  constructor(private readonly systemService: SystemService) {}

  // In-memory mock ambulance requests database (aligned with frontend db.js)
  private ambulanceRequests: AmbulanceRequest[] = [
    {
      id: 'AMB-001',
      patientId: 'P002',
      patientName: 'Maria Garcia',
      pickupLocation: '742 Evergreen Terrace, Springfield',
      contact: '+1 (555) 987-6543',
      notes: 'Patient is experiencing severe chest pains and shortness of breath.',
      status: AmbulanceStatus.DISPATCHED,
      assignedTo: 'U003',
      createdAt: '2026-04-02T10:15:00Z',
      updatedAt: '2026-04-02T10:20:00Z'
    },
    {
      id: 'AMB-002',
      patientId: 'P001',
      patientName: 'John Anderson',
      pickupLocation: '123 Main Street, Downtown',
      contact: '+1 (555) 123-4567',
      notes: 'Mild concussion from a fall.',
      status: AmbulanceStatus.COMPLETED,
      assignedTo: 'U003',
      createdAt: '2026-03-25T14:20:00Z',
      updatedAt: '2026-03-25T16:45:00Z'
    }
  ];

  /**
   * Get all ambulance requests with optional filtering
   * @param patientId Optional patient filter
   * @param status Optional status filter
   * @returns List of ambulance requests
   */
  async findAll(patientId?: string, status?: AmbulanceStatus) {
    try {
      let filteredRequests = [...this.ambulanceRequests];

      // Apply patient filter
      if (patientId) {
        filteredRequests = filteredRequests.filter(req => req.patientId === patientId);
      }

      // Apply status filter
      if (status) {
        filteredRequests = filteredRequests.filter(req => req.status === status);
      }

      return ResponseUtil.success('Ambulance requests retrieved successfully', filteredRequests);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve ambulance requests');
    }
  }

  /**
   * Get ambulance request by ID
   * @param id Request ID
   * @returns Request data
   */
  async findById(id: string) {
    try {
      const request = this.ambulanceRequests.find(r => r.id === id);
      
      if (!request) {
        return ResponseUtil.notFound('Ambulance request', id);
      }

      return ResponseUtil.success('Ambulance request retrieved successfully', request);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve ambulance request');
    }
  }

  /**
   * Create new ambulance request
   * @param requestData Request creation data
   * @returns Created request data
   */
  async create(requestData: CreateAmbulanceRequest) {
    try {
      // Generate new request ID
      const newRequestId = IdGenerator.generateAmbulanceId();

      // Create new request
      const newRequest: AmbulanceRequest = {
        id: newRequestId,
        patientId: requestData.patientId,
        patientName: requestData.patientName || `Patient ${requestData.patientId}`, // Fetch from DTO or fallback
        pickupLocation: requestData.pickupLocation,
        contact: requestData.contact,
        notes: requestData.notes || '',
        status: AmbulanceStatus.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to requests array
      this.ambulanceRequests.push(newRequest);

      // Log activity
      this.systemService.createActivity({
        userId: requestData.patientId,
        action: 'Create',
        details: `Ambulance request ${newRequestId} created for ${newRequest.patientName}`,
        module: 'Ambulance',
        severity: 'INFO'
      });

      return ResponseUtil.created('Ambulance request created successfully', newRequest);
    } catch (error) {
      return ResponseUtil.serverError('Failed to create ambulance request');
    }
  }

  /**
   * Update ambulance request
   * @param id Request ID
   * @param updateData Request update data
   * @returns Updated request data
   */
  async update(id: string, updateData: UpdateAmbulanceRequest) {
    try {
      const requestIndex = this.ambulanceRequests.findIndex(r => r.id === id);
      
      if (requestIndex === -1) {
        return ResponseUtil.notFound('Ambulance request', id);
      }

      // Update request
      const updatedRequest = {
        ...this.ambulanceRequests[requestIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      this.ambulanceRequests[requestIndex] = updatedRequest;

      // Log activity
      const isCompleted = updateData.status === AmbulanceStatus.COMPLETED;
      this.systemService.createActivity({
        userId: updatedRequest.assignedTo || 'System',
        action: isCompleted ? 'Complete' : 'Update',
        details: isCompleted 
          ? `Ambulance transport ${id} completed for ${updatedRequest.patientName}`
          : `Ambulance request ${id} updated to ${updatedRequest.status}`,
        module: 'Ambulance',
        severity: isCompleted ? 'SUCCESS' : 'INFO'
      });

      return ResponseUtil.updated('Ambulance request updated successfully', updatedRequest);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update ambulance request');
    }
  }

  /**
   * Delete ambulance request
   * @param id Request ID
   * @returns Deletion confirmation
   */
  async delete(id: string) {
    try {
      const requestIndex = this.ambulanceRequests.findIndex(r => r.id === id);
      
      if (requestIndex === -1) {
        return ResponseUtil.notFound('Ambulance request', id);
      }

      const request = this.ambulanceRequests[requestIndex];

      // Prevent deletion of completed requests
      if (request.status === AmbulanceStatus.COMPLETED) {
        return ResponseUtil.error('Cannot delete completed ambulance requests');
      }

      // Delete from requests array
      this.ambulanceRequests.splice(requestIndex, 1);

      // Log activity
      this.systemService.createActivity({
        userId: 'Admin',
        action: 'Delete',
        details: `Ambulance request ${id} deleted`,
        module: 'Ambulance',
        severity: 'WARNING'
      });

      return ResponseUtil.success('Ambulance request deleted successfully');
    } catch (error) {
      return ResponseUtil.serverError('Failed to delete ambulance request');
    }
  }

  /**
   * Dispatch ambulance
   * @param id Request ID
   * @param assignedTo User ID of assigned staff
   * @returns Updated request data
   */
  async dispatch(id: string, assignedTo?: string) {
    try {
      const requestIndex = this.ambulanceRequests.findIndex(r => r.id === id);
      
      if (requestIndex === -1) {
        return ResponseUtil.notFound('Ambulance request', id);
      }

      const request = this.ambulanceRequests[requestIndex];

      // Validate status transition
      if (request.status !== AmbulanceStatus.PENDING) {
        return ResponseUtil.error('Cannot dispatch request that is not pending');
      }

      // Update status to dispatched
      this.ambulanceRequests[requestIndex].status = AmbulanceStatus.DISPATCHED;
      this.ambulanceRequests[requestIndex].assignedTo = assignedTo || 'U003'; // Default assignment
      this.ambulanceRequests[requestIndex].updatedAt = new Date().toISOString();

      const updatedRequest = this.ambulanceRequests[requestIndex];

      return ResponseUtil.updated('Ambulance dispatched successfully', updatedRequest);
    } catch (error) {
      return ResponseUtil.serverError('Failed to dispatch ambulance');
    }
  }

  /**
   * Complete ambulance request
   * @param id Request ID
   * @returns Updated request data
   */
  async complete(id: string) {
    try {
      const requestIndex = this.ambulanceRequests.findIndex(r => r.id === id);
      
      if (requestIndex === -1) {
        return ResponseUtil.notFound('Ambulance request', id);
      }

      const request = this.ambulanceRequests[requestIndex];

      // Validate status transition
      if (request.status !== AmbulanceStatus.AT_HOSPITAL) {
        return ResponseUtil.error('Cannot complete request that has not reached hospital');
      }

      // Update status to completed
      this.ambulanceRequests[requestIndex].status = AmbulanceStatus.COMPLETED;
      this.ambulanceRequests[requestIndex].updatedAt = new Date().toISOString();

      const updatedRequest = this.ambulanceRequests[requestIndex];

      return ResponseUtil.updated('Ambulance request completed successfully', updatedRequest);
    } catch (error) {
      return ResponseUtil.serverError('Failed to complete ambulance request');
    }
  }

  /**
   * Update request status
   * @param id Request ID
   * @param status New status
   * @returns Updated request data
   */
  async updateStatus(id: string, status: AmbulanceStatus) {
    try {
      const requestIndex = this.ambulanceRequests.findIndex(r => r.id === id);
      
      if (requestIndex === -1) {
        return ResponseUtil.notFound('Ambulance request', id);
      }

      // Validate status transition
      if (!this.isValidStatusTransition(this.ambulanceRequests[requestIndex].status, status)) {
        return ResponseUtil.error(`Invalid status transition from ${this.ambulanceRequests[requestIndex].status} to ${status}`);
      }

      // Update status
      this.ambulanceRequests[requestIndex].status = status;
      this.ambulanceRequests[requestIndex].updatedAt = new Date().toISOString();

      const updatedRequest = this.ambulanceRequests[requestIndex];

      return ResponseUtil.updated('Request status updated successfully', updatedRequest);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update request status');
    }
  }

  /**
   * Get ambulance statistics
   * @returns Ambulance statistics
   */
  async getStats() {
    try {
      const totalRequests = this.ambulanceRequests.length;
      const pendingRequests = this.ambulanceRequests.filter(r => r.status === AmbulanceStatus.PENDING).length;
      const dispatchedRequests = this.ambulanceRequests.filter(r => r.status === AmbulanceStatus.DISPATCHED).length;
      const enRouteRequests = this.ambulanceRequests.filter(r => r.status === AmbulanceStatus.EN_ROUTE).length;
      const pickedUpRequests = this.ambulanceRequests.filter(r => r.status === AmbulanceStatus.PICKED_UP).length;
      const atHospitalRequests = this.ambulanceRequests.filter(r => r.status === AmbulanceStatus.AT_HOSPITAL).length;
      const completedRequests = this.ambulanceRequests.filter(r => r.status === AmbulanceStatus.COMPLETED).length;

      // Calculate average response time (placeholder)
      const averageResponseTime = 15; // minutes

      // By status
      const byStatus: Record<AmbulanceStatus, number> = {
        [AmbulanceStatus.PENDING]: pendingRequests,
        [AmbulanceStatus.DISPATCHED]: dispatchedRequests,
        [AmbulanceStatus.EN_ROUTE]: enRouteRequests,
        [AmbulanceStatus.PICKED_UP]: pickedUpRequests,
        [AmbulanceStatus.AT_HOSPITAL]: atHospitalRequests,
        [AmbulanceStatus.COMPLETED]: completedRequests
      };

      const stats: AmbulanceStats = {
        total: totalRequests,
        pending: pendingRequests,
        dispatched: dispatchedRequests,
        enRoute: enRouteRequests,
        pickedUp: pickedUpRequests,
        atHospital: atHospitalRequests,
        completed: completedRequests,
        averageResponseTime,
        byStatus
      };

      return ResponseUtil.success('Ambulance statistics retrieved successfully', stats);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve ambulance statistics');
    }
  }

  /**
   * Get requests by patient
   * @param patientId Patient ID
   * @returns Patient requests
   */
  async findByPatient(patientId: string) {
    try {
      const requests = this.ambulanceRequests.filter(r => r.patientId === patientId);
      
      return ResponseUtil.success(`Ambulance requests for patient ${patientId} retrieved successfully`, requests);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve patient ambulance requests');
    }
  }

  /**
   * Get active requests (not completed)
   * @returns Active requests
   */
  async getActiveRequests() {
    try {
      const activeRequests = this.ambulanceRequests.filter(r => r.status !== AmbulanceStatus.COMPLETED);
      
      return ResponseUtil.success('Active ambulance requests retrieved successfully', activeRequests);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve active ambulance requests');
    }
  }

  /**
   * Get requests by assigned staff
   * @param assignedTo Staff user ID
   * @returns Assigned requests
   */
  async findByAssignedStaff(assignedTo: string) {
    try {
      const requests = this.ambulanceRequests.filter(r => r.assignedTo === assignedTo);
      
      return ResponseUtil.success(`Ambulance requests assigned to ${assignedTo} retrieved successfully`, requests);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve assigned ambulance requests');
    }
  }

  /**
   * Validate status transition
   * @param currentStatus Current status
   * @param newStatus New status
   * @returns True if transition is valid
   */
  private isValidStatusTransition(currentStatus: AmbulanceStatus, newStatus: AmbulanceStatus): boolean {
    const validTransitions: Record<AmbulanceStatus, AmbulanceStatus[]> = {
      [AmbulanceStatus.PENDING]: [AmbulanceStatus.DISPATCHED],
      [AmbulanceStatus.DISPATCHED]: [AmbulanceStatus.EN_ROUTE],
      [AmbulanceStatus.EN_ROUTE]: [AmbulanceStatus.PICKED_UP],
      [AmbulanceStatus.PICKED_UP]: [AmbulanceStatus.AT_HOSPITAL],
      [AmbulanceStatus.AT_HOSPITAL]: [AmbulanceStatus.COMPLETED],
      [AmbulanceStatus.COMPLETED]: [] // No transitions from completed
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}
