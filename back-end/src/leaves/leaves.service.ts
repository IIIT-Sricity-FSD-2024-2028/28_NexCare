import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { Leave, CreateLeaveDto, UpdateLeaveDto, LeaveCalendarView } from './interfaces/leave.interface';
import { LeaveStatus } from '../common/interfaces/api-response.interface';

/**
 * Leaves Service
 * Manages doctor leave requests and approvals in the NexCare system
 * Handles CRUD operations for leaves with business logic
 */
@Injectable()
export class LeavesService {
  private readonly leavesFilePath = path.join(process.cwd(), 'data', 'leaves.json');

  /** Load leaves from disk */
  private loadLeaves(): Leave[] {
    try {
      if (!fs.existsSync(this.leavesFilePath)) {
        const initial = this.getInitialMockData();
        this.saveLeaves(initial);
        return initial;
      }
      const raw = fs.readFileSync(this.leavesFilePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return this.getInitialMockData();
    }
  }

  /** Persist leaves to disk */
  private saveLeaves(leaves: Leave[]): void {
    try {
      fs.mkdirSync(path.dirname(this.leavesFilePath), { recursive: true });
      fs.writeFileSync(this.leavesFilePath, JSON.stringify(leaves, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist leaves:', err);
    }
  }

  private getInitialMockData(): Leave[] {
    return [
      {
        id: 'L001',
        doctorId: 'U007',
        doctorName: 'Dr. Anjali Desai',
        hospitalId: 'H001',
        startDate: '2026-08-20',
        endDate: '2026-08-25',
        reason: 'Family vacation',
        status: LeaveStatus.APPROVED,
        createdAt: '2026-08-15T00:00:00Z',
        updatedAt: '2026-08-16T00:00:00Z',
        approvedBy: 'U002',
        approvedAt: '2026-08-16T00:00:00Z'
      },
      {
        id: 'L002',
        doctorId: 'U005',
        doctorName: 'Dr. Sarah Smith',
        hospitalId: 'H001',
        startDate: '2026-09-01',
        endDate: '2026-09-03',
        reason: 'Medical conference attendance',
        status: LeaveStatus.PENDING,
        createdAt: '2026-08-20T00:00:00Z',
        updatedAt: '2026-08-20T00:00:00Z'
      }
    ];
  }

  // Leaves database initialized from disk
  private leaves: Leave[] = this.loadLeaves();

  /**
   * Get all leaves with optional filtering
   */
  findAll(doctorId?: string, hospitalId?: string, status?: LeaveStatus): any {
    let filtered = [...this.leaves];

    if (doctorId) {
      filtered = filtered.filter(leave => leave.doctorId === doctorId);
    }

    if (hospitalId) {
      filtered = filtered.filter(leave => leave.hospitalId === hospitalId);
    }

    if (status) {
      filtered = filtered.filter(leave => leave.status === status);
    }

    return ResponseUtil.success('Leaves retrieved successfully', filtered);
  }

  /**
   * Get leave by ID
   */
  findById(id: string): any {
    const leave = this.leaves.find(l => l.id === id);
    if (!leave) {
      return ResponseUtil.error('Leave not found', 404);
    }
    return ResponseUtil.success('Leave retrieved successfully', leave);
  }

  /**
   * Create a new leave request
   */
  async create(createLeaveDto: CreateLeaveDto): Promise<any> {
    // Validate date order
    const start = new Date(createLeaveDto.startDate);
    const end = new Date(createLeaveDto.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return ResponseUtil.error('Invalid date format');
    }

    if (end < start) {
      return ResponseUtil.error('End date cannot be before start date');
    }

    // Validate future dates only
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return ResponseUtil.error('Cannot submit leave requests for past dates');
    }

    // Check for overlapping approved leaves
    const hasOverlap = await this.hasOverlappingLeave(
      createLeaveDto.doctorId,
      createLeaveDto.startDate,
      createLeaveDto.endDate
    );
    if (hasOverlap) {
      return ResponseUtil.error('Doctor already has approved leave during this period');
    }

    // Calculate days count if not provided
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = createLeaveDto.daysCount || (Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const newLeave: Leave = {
      id: IdGenerator.generate('L'),
      ...createLeaveDto,
      daysCount,
      requestedAt: createLeaveDto.requestedAt || new Date().toISOString().split('T')[0],
      status: LeaveStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.leaves.push(newLeave);
    this.saveLeaves(this.leaves);

    return ResponseUtil.success('Leave request submitted successfully', newLeave);
  }

  /**
   * Update leave status (approve/reject)
   */
  update(id: string, updateLeaveDto: UpdateLeaveDto): any {
    const index = this.leaves.findIndex(l => l.id === id);
    if (index === -1) {
      return ResponseUtil.error('Leave not found', 404);
    }

    const now = new Date().toISOString();
    const isApproved = updateLeaveDto.status === LeaveStatus.APPROVED;
    const isRejected = updateLeaveDto.status === LeaveStatus.REJECTED;

    this.leaves[index] = {
      ...this.leaves[index],
      ...updateLeaveDto,
      updatedAt: now,
      approvedAt: isApproved ? now : this.leaves[index].approvedAt,
      approvedBy: isApproved ? updateLeaveDto.approvedBy : this.leaves[index].approvedBy,
      approvedByName: isApproved ? updateLeaveDto.approvedByName : this.leaves[index].approvedByName,
      rejectedAt: isRejected ? now : this.leaves[index].rejectedAt,
      rejectedBy: isRejected ? (updateLeaveDto.rejectedBy || updateLeaveDto.approvedBy) : this.leaves[index].rejectedBy,
      rejectedByName: isRejected ? (updateLeaveDto.rejectedByName || updateLeaveDto.approvedByName) : this.leaves[index].rejectedByName,
      rejectionReason: isRejected ? updateLeaveDto.rejectionReason : this.leaves[index].rejectionReason
    };

    this.saveLeaves(this.leaves);

    return ResponseUtil.success('Leave status updated successfully', this.leaves[index]);
  }

  /**
   * Delete a leave request
   */
  delete(id: string): any {
    const index = this.leaves.findIndex(l => l.id === id);
    if (index === -1) {
      return ResponseUtil.error('Leave not found', 404);
    }

    this.leaves.splice(index, 1);
    this.saveLeaves(this.leaves);

    return ResponseUtil.success(null, 'Leave deleted successfully');
  }

  /**
   * Check for overlapping approved leaves
   */
  async hasOverlappingLeave(doctorId: string, startDate: string, endDate: string): Promise<boolean> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const overlapping = this.leaves.some(leave => {
      if (leave.doctorId !== doctorId || leave.status !== LeaveStatus.APPROVED) {
        return false;
      }

      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);

      // Check for date overlap
      return start <= leaveEnd && end >= leaveStart;
    });

    return overlapping;
  }

  /**
   * Get calendar view of approved leaves
   */
  getCalendarView(hospitalId?: string, startDate?: string, endDate?: string): any {
    let filtered = this.leaves.filter(leave => leave.status === LeaveStatus.APPROVED);

    if (hospitalId) {
      filtered = filtered.filter(leave => leave.hospitalId === hospitalId);
    }

    if (startDate) {
      const filterStart = new Date(startDate);
      filtered = filtered.filter(leave => new Date(leave.startDate) >= filterStart);
    }

    if (endDate) {
      const filterEnd = new Date(endDate);
      filtered = filtered.filter(leave => new Date(leave.endDate) <= filterEnd);
    }

    // Group by date
    const calendarMap = new Map<string, LeaveCalendarView['doctorsOnLeave']>();

    filtered.forEach(leave => {
      const current = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];

        if (!calendarMap.has(dateStr)) {
          calendarMap.set(dateStr, []);
        }

        calendarMap.get(dateStr)!.push({
          doctorId: leave.doctorId,
          doctorName: leave.doctorName,
          reason: leave.reason
        });

        current.setDate(current.getDate() + 1);
      }
    });

    // Convert map to array and sort by date
    const calendarView: LeaveCalendarView[] = Array.from(calendarMap.entries())
      .map(([date, doctors]) => ({
        date,
        doctorsOnLeave: doctors
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return ResponseUtil.success('Calendar view retrieved successfully', calendarView);
  }
}
