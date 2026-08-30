import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import {
  HospitalSchedule,
  CreateHospitalScheduleDto,
  UpdateHospitalScheduleDto,
  HospitalScheduleStatus,
} from './interfaces/schedule.interface';

@Injectable()
export class SchedulesService {
  private readonly filePath = path.join(process.cwd(), 'data', 'schedules.json');

  private load(): HospitalSchedule[] {
    try {
      if (!fs.existsSync(this.filePath)) {
        const initial = this.seed();
        this.save(initial);
        return initial;
      }
      return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
    } catch {
      return this.seed();
    }
  }

  private save(rows: HospitalSchedule[]): void {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(rows, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist schedules:', err);
    }
  }

  private seed(): HospitalSchedule[] {
    const depts = ['Cardiology', 'Orthopedics', 'Neurology', 'General Medicine', 'ER', 'Pathology'];
    const shifts = [
      { shift: 'Morning (08:00 - 16:00)', startTime: '08:00', endTime: '16:00' },
      { shift: 'Afternoon (14:00 - 22:00)', startTime: '14:00', endTime: '22:00' },
      { shift: 'Night (20:00 - 08:00)', startTime: '20:00', endTime: '08:00' },
    ];
    return [
      {
        id: 'SCH001',
        hospitalId: 'H001',
        hospitalName: 'NexCare AIIMS Super Speciality Hospital',
        validFrom: '2026-01-01',
        validTo: '2027-12-31',
        slots: depts.flatMap(department => shifts.map(s => ({ department, ...s }))),
        notes: 'Published hospital-wide OPD roster',
        status: 'approved',
        submittedBy: 'system',
        approvedBy: 'HM001',
        approvedAt: '2026-01-01T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];
  }

  findAll(hospitalId?: string, status?: HospitalScheduleStatus) {
    let rows = this.load();
    if (hospitalId) rows = rows.filter(s => s.hospitalId === hospitalId);
    if (status) rows = rows.filter(s => s.status === status);
    return ResponseUtil.success('Schedules retrieved successfully', rows);
  }

  findById(id: string) {
    const row = this.load().find(s => s.id === id);
    if (!row) return ResponseUtil.error('Schedule not found', 404);
    return ResponseUtil.success('Schedule retrieved successfully', row);
  }

  create(dto: CreateHospitalScheduleDto) {
    if (!dto.hospitalId || !dto.validFrom || !dto.validTo) {
      return ResponseUtil.error('hospitalId, validFrom and validTo are required');
    }
    if (!Array.isArray(dto.slots) || dto.slots.length === 0) {
      return ResponseUtil.error('Add at least one department shift to the hospital schedule');
    }
    const from = new Date(dto.validFrom);
    const to = new Date(dto.validTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || to < from) {
      return ResponseUtil.error('Invalid schedule date range');
    }

    const rows = this.load();
    const created: HospitalSchedule = {
      id: IdGenerator.generate('SCH'),
      hospitalId: dto.hospitalId,
      hospitalName: dto.hospitalName,
      validFrom: dto.validFrom,
      validTo: dto.validTo,
      slots: dto.slots,
      notes: dto.notes,
      status: 'pending',
      submittedBy: dto.submittedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    rows.push(created);
    this.save(rows);
    return ResponseUtil.success('Schedule submitted for hospital manager approval', created);
  }

  update(id: string, dto: UpdateHospitalScheduleDto) {
    const rows = this.load();
    const index = rows.findIndex(s => s.id === id);
    if (index === -1) return ResponseUtil.error('Schedule not found', 404);

    if (dto.status !== 'approved' && dto.status !== 'rejected') {
      return ResponseUtil.error('Status must be approved or rejected');
    }

    rows[index] = {
      ...rows[index],
      status: dto.status,
      approvedBy: dto.approvedBy,
      approvedAt: dto.status === 'approved' ? new Date().toISOString() : rows[index].approvedAt,
      rejectionReason: dto.rejectionReason,
      updatedAt: new Date().toISOString(),
    };
    this.save(rows);
    return ResponseUtil.success(
      dto.status === 'approved' ? 'Hospital schedule published' : 'Hospital schedule rejected',
      rows[index],
    );
  }

  /**
   * True when an appointment date/time falls inside a published (approved)
   * hospital-wide roster for that department. Unpublished drafts are ignored.
   */
  isPublishedCoverage(hospitalId: string | undefined, department: string, dateLabel: string, timeLabel: string): boolean {
    if (!hospitalId) return true;

    const aptDate = this.parseDate(dateLabel);
    if (!aptDate) return false;

    const minutes = this.parseTimeMinutes(timeLabel);
    const published = this.load().filter(
      s => s.hospitalId === hospitalId && s.status === 'approved',
    );
    if (published.length === 0) return false;

    return published.some(schedule => {
      const from = this.parseDate(schedule.validFrom);
      const to = this.parseDate(schedule.validTo);
      if (!from || !to || aptDate < from || aptDate > to) return false;

      return schedule.slots.some(slot => {
        const deptOk =
          !department ||
          slot.department === department ||
          slot.department === 'All';
        if (!deptOk) return false;
        if (minutes === null) return true;
        return this.timeInShift(minutes, slot.startTime, slot.endTime);
      });
    });
  }

  hasPublishedSchedule(hospitalId: string | undefined): boolean {
    if (!hospitalId) return true;
    return this.load().some(s => s.hospitalId === hospitalId && s.status === 'approved');
  }

  private parseDate(value: string): Date | null {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private parseTimeMinutes(label: string): number | null {
    if (!label) return null;
    const ampm = String(label).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampm) {
      let hours = Number(ampm[1]);
      const mins = Number(ampm[2]);
      const mer = ampm[3].toUpperCase();
      if (mer === 'PM' && hours !== 12) hours += 12;
      if (mer === 'AM' && hours === 12) hours = 0;
      return hours * 60 + mins;
    }
    const h24 = String(label).trim().match(/^(\d{1,2}):(\d{2})$/);
    if (h24) return Number(h24[1]) * 60 + Number(h24[2]);
    return null;
  }

  private timeInShift(minutes: number, start: string, end: string): boolean {
    const startM = this.parseTimeMinutes(start);
    const endM = this.parseTimeMinutes(end);
    if (startM === null || endM === null) return true;
    if (endM > startM) return minutes >= startM && minutes < endM;
    return minutes >= startM || minutes < endM;
  }
}
