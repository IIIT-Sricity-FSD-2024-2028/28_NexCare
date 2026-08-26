import { LeaveStatus } from '../../common/interfaces/api-response.interface';

/**
 * Leave Interface
 * Represents a doctor's leave request in the NexCare system
 */
export interface Leave {
  id: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

/**
 * Create Leave DTO
 * Interface for creating a new leave request
 */
export interface CreateLeaveDto {
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

/**
 * Update Leave DTO
 * Interface for updating leave status (approve/reject)
 */
export interface UpdateLeaveDto {
  status: LeaveStatus;
  approvedBy?: string;
  rejectionReason?: string;
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
