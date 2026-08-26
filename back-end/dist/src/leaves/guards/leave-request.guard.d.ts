import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LeavesService } from '../leaves.service';
export declare class LeaveRequestGuard implements CanActivate {
    private readonly reflector;
    private readonly leavesService;
    constructor(reflector: Reflector, leavesService: LeavesService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private validateLeaveApplication;
    private validateLeaveApproval;
}
