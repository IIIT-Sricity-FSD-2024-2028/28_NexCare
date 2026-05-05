import { BillStatus } from '../../common/interfaces/api-response.interface';
import { BillItemDto } from './create-bill.dto';
export declare class UpdateBillDto {
    visitDate?: string;
    dueDate?: string;
    status?: BillStatus;
    items?: BillItemDto[];
}
