import { AppointmentStatus } from '../../common/interfaces/api-response.interface';
export interface Appointment {
    id: string;
    patientId: string;
    patientName: string;
    department: string;
    doctor: string;
    dateLabel: string;
    timeLabel: string;
    token: string;
    fee: number;
    status: AppointmentStatus;
    reason: string;
    createdAt: string;
    updatedAt?: string;
}
export interface CreateAppointmentRequest {
    patientId: string;
    department: string;
    doctor?: string;
    dateLabel: string;
    timeLabel: string;
    fee?: number;
    reason?: string;
}
export interface UpdateAppointmentRequest {
    department?: string;
    doctor?: string;
    dateLabel?: string;
    timeLabel?: string;
    fee?: number;
    status?: AppointmentStatus;
    reason?: string;
}
export interface AppointmentStats {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    today: number;
    byDepartment: Record<string, number>;
    revenue: number;
}
