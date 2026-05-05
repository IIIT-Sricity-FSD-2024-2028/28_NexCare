import { AmbulanceStatus } from '../../common/interfaces/api-response.interface';
export interface AmbulanceRequest {
    id: string;
    patientId: string;
    patientName: string;
    pickupLocation: string;
    contact: string;
    notes: string;
    status: AmbulanceStatus;
    assignedTo?: string;
    createdAt: string;
    updatedAt?: string;
    stepIndex?: number;
    completedDate?: string;
    completedTime?: string;
}
export interface CreateAmbulanceRequest {
    patientId: string;
    pickupLocation: string;
    contact: string;
    notes?: string;
    patientName?: string;
}
export interface UpdateAmbulanceRequest {
    pickupLocation?: string;
    contact?: string;
    notes?: string;
    status?: AmbulanceStatus;
    assignedTo?: string;
}
export interface AmbulanceStats {
    total: number;
    pending: number;
    dispatched: number;
    enRoute: number;
    pickedUp: number;
    atHospital: number;
    completed: number;
    averageResponseTime: number;
    byStatus: Record<AmbulanceStatus, number>;
}
