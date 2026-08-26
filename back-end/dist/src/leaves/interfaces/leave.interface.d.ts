import { LeaveStatus } from '../../common/interfaces/api-response.interface';
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
export interface CreateLeaveDto {
    doctorId: string;
    doctorName: string;
    hospitalId: string;
    startDate: string;
    endDate: string;
    reason: string;
}
export interface UpdateLeaveDto {
    status: LeaveStatus;
    approvedBy?: string;
    rejectionReason?: string;
}
export interface LeaveCalendarView {
    date: string;
    doctorsOnLeave: Array<{
        doctorId: string;
        doctorName: string;
        reason: string;
    }>;
}
