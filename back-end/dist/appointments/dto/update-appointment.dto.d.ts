import { AppointmentStatus } from '../../common/interfaces/api-response.interface';
export declare class UpdateAppointmentDto {
    department?: string;
    doctor?: string;
    dateLabel?: string;
    timeLabel?: string;
    fee?: number;
    status?: AppointmentStatus;
    reason?: string;
}
