import { LeaveStatus } from '../../common/interfaces/api-response.interface';

/**
 * Leave Interface
 * Represents a doctor's leave request in the NexCare system
 */
export interface Leave {
  id: string;
  doctorId: string;
  doctorName: string;
  department?: string;
  specialization?: string;
  hospitalId: string;
  leaveType?: string;
  startDate: string;
  endDate: string;
  daysCount?: number;
  reason: string;
  requestedAt?: string;
  status: LeaveStatus;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
}

/**
 * Create Leave DTO
 * Interface for creating a new leave request
 */
export interface CreateLeaveDto {
  doctorId: string;
  doctorName: string;
  department?: string;
  specialization?: string;
  hospitalId: string;
  leaveType?: string;
  startDate: string;
  endDate: string;
  daysCount?: number;
  reason: string;
  requestedAt?: string;
}

/**
 * Update Leave DTO
 * Interface for updating leave status (approve/reject)
 */
export interface UpdateLeaveDto {
  status: LeaveStatus;
  approvedBy?: string;
  approvedByName?: string;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedByName?: string;
}

/**
 * Leave Calendar View Interface
 * Interface for calendar view of approved leaves
 */
export interface LeaveCalendarView {
  date: string;
  doctorsOnLeave: Array<{
    doctorId: string;
    doctorName: string;
    reason: string;
  }>;
}
