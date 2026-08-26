import { LeavesService } from './leaves.service';
import { CreateLeaveDto, UpdateLeaveDto } from './interfaces/leave.interface';
import { LeaveStatus } from '../common/interfaces/api-response.interface';
export declare class LeavesController {
    private readonly leavesService;
    constructor(leavesService: LeavesService);
    findAll(doctorId?: string, hospitalId?: string, status?: LeaveStatus): Promise<any>;
    getCalendarView(hospitalId?: string, startDate?: string, endDate?: string): Promise<any>;
    findById(id: string): Promise<any>;
    create(createLeaveDto: CreateLeaveDto): Promise<any>;
    update(id: string, updateLeaveDto: UpdateLeaveDto): Promise<any>;
    delete(id: string): Promise<any>;
}
