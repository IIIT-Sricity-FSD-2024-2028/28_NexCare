import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { Leave, CreateLeaveDto, UpdateLeaveDto, LeaveCalendarView } from './interfaces/leave.interface';
import { LeaveStatus } from '../common/interfaces/api-response.interface';
import { AppointmentsService } from '../appointments/appointments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationEntityType } from '../notifications/interfaces/notification.interface';

/**
 * Leaves Service
 * Manages doctor leave requests and approvals in the NexCare system
 * Handles CRUD operations for leaves with business logic
 */
@Injectable()
export class LeavesService {
  constructor(
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointmentsService: AppointmentsService,
    private readonly notificationsService?: NotificationsService,
  ) {}

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
    fs.mkdirSync(path.dirname(this.leavesFilePath), { recursive: true });
    const temporaryPath = this.leavesFilePath + '.tmp';
    fs.writeFileSync(temporaryPath, JSON.stringify(leaves, null, 2), 'utf-8');
    fs.renameSync(temporaryPath, this.leavesFilePath);
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

    const records = [...this.leaves, newLeave];
    this.saveLeaves(records);
    this.leaves = records;

    // Notify Hospital Manager of new leave request
    if (this.notificationsService) {
      this.notificationsService.create({
        recipientRole: 'hospital_manager',
        hospitalId: newLeave.hospitalId,
        type: NotificationType.ACTION_REQUIRED,
        title: 'New Leave Request',
        message: `New leave request from ${newLeave.doctorName || 'Doctor'} (${newLeave.startDate} to ${newLeave.endDate}).`,
        entityType: NotificationEntityType.LEAVE,
        entityId: newLeave.id,
      });
    }

    return ResponseUtil.success('Leave request submitted successfully', newLeave);
  }

  /**
   * Update leave status (approve/reject).
   * Approval is hospital-manager gated (LeaveRequestGuard) and then
   * reassigns or cancels appointments in the leave window.
   */
  async editPending(id: string, hospitalId: string, doctorId: string | undefined, details: Partial<CreateLeaveDto>) {
    const leave = this.leaves.find((row) => row.id === id && row.hospitalId === hospitalId
      && (!doctorId || row.doctorId === doctorId));
    if (!leave) throw new NotFoundException('Leave request not found');
    if (leave.status !== LeaveStatus.PENDING) throw new ConflictException('Only pending leave requests can be edited');
    const { startDate, endDate, reason } = details ?? {};
    const start = new Date(startDate || '');
    const end = new Date(endDate || '');
    const today = new Date().toISOString().slice(0, 10);
    const isoDate = (value: string | undefined, parsed: Date) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value)
      && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value);
    if (!startDate || !endDate || !isoDate(startDate, start) || !isoDate(endDate, end)
      || startDate < today || end < start || typeof reason !== 'string' || !reason.trim()) {
      throw new BadRequestException('Provide valid leave dates and a reason');
    }
    if (await this.hasOverlappingLeave(leave.doctorId, startDate, endDate)) {
      throw new ConflictException('That staff member already has approved leave during this period');
    }
    if (leave.status !== LeaveStatus.PENDING || !this.leaves.includes(leave)) {
      throw new ConflictException('This leave request changed while you were editing it');
    }
    const updated = { ...leave, startDate, endDate, reason: reason.trim(),
      daysCount: (end.getTime() - start.getTime()) / 86_400_000 + 1, updatedAt: new Date().toISOString() };
    const records = this.leaves.map((row) => row.id === id ? updated : row);
    this.saveLeaves(records);
    this.leaves = records;
    return ResponseUtil.updated('Leave request updated', updated);
  }

  async update(id: string, updateLeaveDto: UpdateLeaveDto): Promise<any> {
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

    // Notify Doctor of decision
    if (this.notificationsService) {
      const leaveDoc = this.leaves[index];
      if (isApproved) {
        this.notificationsService.create({
          recipientUserId: leaveDoc.doctorId,
          recipientRole: 'doctor',
          hospitalId: leaveDoc.hospitalId,
          type: NotificationType.SUCCESS,
          title: 'Leave Request Approved',
          message: `Your leave request (${leaveDoc.startDate} to ${leaveDoc.endDate}) has been approved.`,
          entityType: NotificationEntityType.LEAVE,
          entityId: leaveDoc.id,
        });
      } else if (isRejected) {
        this.notificationsService.create({
          recipientUserId: leaveDoc.doctorId,
          recipientRole: 'doctor',
          hospitalId: leaveDoc.hospitalId,
          type: NotificationType.WARNING,
          title: 'Leave Request Rejected',
          message: `Your leave request (${leaveDoc.startDate} to ${leaveDoc.endDate}) was rejected.${leaveDoc.rejectionReason ? ' Reason: ' + leaveDoc.rejectionReason : ''}`,
          entityType: NotificationEntityType.LEAVE,
          entityId: leaveDoc.id,
        });
      }
    }

    if (updateLeaveDto.status === LeaveStatus.APPROVED) {
      await this.appointmentsService.handleDoctorLeaveApproved(this.leaves[index]);
    }

    return ResponseUtil.success('Leave status updated successfully', this.leaves[index]);
  }

  /**
   * Delete a leave request
   */
  delete(id: string, hospitalId?: string, doctorId?: string): any {
    const index = this.leaves.findIndex((row) => row.id === id
      && (!hospitalId || row.hospitalId === hospitalId) && (!doctorId || row.doctorId === doctorId));
    if (index === -1) {
      return ResponseUtil.error('Leave not found', 404);
    }

    if (hospitalId && this.leaves[index].status !== LeaveStatus.PENDING) {
      throw new ConflictException('Only pending leave requests can be withdrawn');
    }
    const records = this.leaves.filter((_, rowIndex) => index !== rowIndex);
    this.saveLeaves(records);
    this.leaves = records;
    return ResponseUtil.deleted('Leave');
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
