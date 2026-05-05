import { AmbulanceStatus } from '../../common/interfaces/api-response.interface';
export declare class UpdateAmbulanceRequestDto {
    pickupLocation?: string;
    contact?: string;
    notes?: string;
    status?: AmbulanceStatus;
    assignedTo?: string;
    stepIndex?: number;
    completedDate?: string;
    completedTime?: string;
}
