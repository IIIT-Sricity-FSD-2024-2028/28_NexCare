import { BedStatus } from '../../common/interfaces/api-response.interface';
export declare class UpdateBedDto {
    ward?: string;
    status?: BedStatus;
    patient?: string;
}
