import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LeavesService } from '../leaves.service';
import { UserRole, LeaveStatus } from '../../common/interfaces/api-response.interface';

/**
 * Leave Request Guard
 * 
 * Validates leave requests and approvals:
 * - POST /leaves: Ensures no overlapping approved leaves for the doctor
 * - PATCH /leaves/:id: Ensures only hospital_manager or superuser can approve/reject
 */
@Injectable()
export class LeaveRequestGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly leavesService: LeavesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // POST /leaves - Apply for leave
    if (method === 'POST') {
      return this.validateLeaveApplication(request);
    }

    // PATCH /leaves/:id - Approve/reject leave
    if (method === 'PATCH') {
      return this.validateLeaveApproval(request);
    }

    // Allow other methods (GET, DELETE, etc.)
    return true;
  }

  /**
   * Validate that the doctor doesn't have overlapping approved leaves
   */
  private async validateLeaveApplication(request: any): Promise<boolean> {
    const { doctorId, startDate, endDate } = request.body || {};
    const effectiveDoctorId = doctorId || request.user?.sub || request.user?.id || request.user?.userId;

    if (!effectiveDoctorId || !startDate || !endDate) {
      return true; // Let validation layer handle missing fields
    }

    // Check for overlapping approved leaves
    const hasOverlap = await this.leavesService.hasOverlappingLeave(
      effectiveDoctorId,
      startDate,
      endDate,
    );

    if (hasOverlap) {
      throw new ConflictException(
        'You already have an approved leave during this period. Please choose different dates.',
      );
    }

    return true;
  }

  /**
   * Validate that only hospital_manager or superuser can approve/reject leaves
   */
  private validateLeaveApproval(request: any): boolean {
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Only hospital_manager and superuser can approve/reject leaves
    if (user.role !== UserRole.HOSPITAL_MANAGER && user.role !== UserRole.SUPERUSER) {
      throw new ForbiddenException(
        'Only hospital managers and superusers can approve or reject leave requests',
      );
    }

    return true;
  }
}
