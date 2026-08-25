import { BedStatus } from '../../common/interfaces/api-response.interface';
export interface Bed {
    id: string;
    ward: string;
    status: BedStatus;
    patient?: string;
    hospitalId?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface CreateBedRequest {
    id: string;
    ward: string;
}
export interface UpdateBedRequest {
    ward?: string;
    status?: BedStatus;
    patient?: string;
}
export interface BedStats {
    total: number;
    available: number;
    occupied: number;
    critical: number;
    maintenance: number;
    byWard: Record<string, number>;
    occupancyRate: number;
}
