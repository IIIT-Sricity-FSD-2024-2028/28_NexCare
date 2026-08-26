import { CreateLeaveDto, UpdateLeaveDto } from './interfaces/leave.interface';
import { LeaveStatus } from '../common/interfaces/api-response.interface';
export declare class LeavesService {
    private readonly leavesFilePath;
    private loadLeaves;
    private saveLeaves;
    private getInitialMockData;
    private leaves;
    findAll(doctorId?: string, hospitalId?: string, status?: LeaveStatus): any;
    findById(id: string): any;
    create(createLeaveDto: CreateLeaveDto): any;
    update(id: string, updateLeaveDto: UpdateLeaveDto): any;
    delete(id: string): any;
    hasOverlappingLeave(doctorId: string, startDate: string, endDate: string): Promise<boolean>;
    getCalendarView(hospitalId?: string, startDate?: string, endDate?: string): any;
}
