import * as fs from 'fs';
import * as path from 'path';
import { Injectable, ForbiddenException } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import {
  ScheduleBlock,
  ScheduleException,
  ComputedSlot,
  CreateScheduleBlockDto,
  CreateScheduleExceptionDto,
  ScheduleExceptionType,
} from './interfaces/schedule.interface';

/**
 * DoctorScheduleService — Two-Layer Doctor Scheduling
 *
 * Layer 1 (ScheduleBlock): Recurring weekly availability per doctor.
 *   Each block encodes dayOfWeek, startTime, endTime, slotDurationMinutes,
 *   maxPatientsPerSlot, and bufferMinutes. Slots are computed on demand —
 *   no pre-materialisation needed.
 *
 * Layer 2 (ScheduleException): Date-specific overrides.
 *   BLOCKED         — cancels all slots on that date.
 *   EMERGENCY_HOLD  — same as BLOCKED but flagged as an emergency.
 *   MODIFIED_HOURS  — replaces the slot window with a different startTime/endTime.
 *
 * Resolution: available_slots(doctor, date) =
 *   generate_from_block(dayOfWeek) → apply exception if one exists for that date.
 *
 * Overlap prevention: booking writes are serialised per doctor via a
 * per-doctor in-memory lock map. Two concurrent requests for the same slot
 * will not both succeed — the second will see the updated bookedCount from
 * the first and receive a 409.
 */
@Injectable()
export class DoctorScheduleService {
  private readonly blocksPath = path.join(process.cwd(), 'data', 'doctor-schedule-blocks.json');
  private readonly exceptionsPath = path.join(process.cwd(), 'data', 'doctor-schedule-exceptions.json');
  private readonly bookingsPath = path.join(process.cwd(), 'data', 'doctor-slot-bookings.json');

  /**
   * Per-doctor write locks. Prevents two concurrent booking requests for the
   * same doctor from both passing the capacity check simultaneously.
   */
  private readonly doctorLocks = new Map<string, Promise<void>>();

  // ── Persistence helpers ─────────────────────────────────────────────────────

  private loadBlocks(): ScheduleBlock[] {
    try {
      if (!fs.existsSync(this.blocksPath)) return [];
      return JSON.parse(fs.readFileSync(this.blocksPath, 'utf-8'));
    } catch { return []; }
  }

  private saveBlocks(blocks: ScheduleBlock[]): void {
    fs.mkdirSync(path.dirname(this.blocksPath), { recursive: true });
    const tmp = `${this.blocksPath}.tmp.${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(blocks, null, 2), 'utf-8');
    fs.renameSync(tmp, this.blocksPath);
  }

  private loadExceptions(): ScheduleException[] {
    try {
      if (!fs.existsSync(this.exceptionsPath)) return [];
      return JSON.parse(fs.readFileSync(this.exceptionsPath, 'utf-8'));
    } catch { return []; }
  }

  private saveExceptions(exceptions: ScheduleException[]): void {
    fs.mkdirSync(path.dirname(this.exceptionsPath), { recursive: true });
    const tmp = `${this.exceptionsPath}.tmp.${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(exceptions, null, 2), 'utf-8');
    fs.renameSync(tmp, this.exceptionsPath);
  }

  /** Slot bookings: { doctorId, date, slotStartTime, bookedCount } */
  private loadBookings(): Array<{ doctorId: string; date: string; slotStartTime: string; bookedCount: number }> {
    try {
      if (!fs.existsSync(this.bookingsPath)) return [];
      return JSON.parse(fs.readFileSync(this.bookingsPath, 'utf-8'));
    } catch { return []; }
  }

  private saveBookings(bookings: any[]): void {
    fs.mkdirSync(path.dirname(this.bookingsPath), { recursive: true });
    const tmp = `${this.bookingsPath}.tmp.${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(bookings, null, 2), 'utf-8');
    fs.renameSync(tmp, this.bookingsPath);
  }

  // ── Time utilities ──────────────────────────────────────────────────────────

  private toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  private fromMinutes(mins: number): string {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // ── Slot Generation ─────────────────────────────────────────────────────────

  /**
   * Generate computed slots for a doctor on a given date.
   * Applies any exception for that date before returning.
   */
  generateSlots(doctorId: string, date: string): ComputedSlot[] {
    const isoDate = new Date(date);
    if (isNaN(isoDate.getTime())) return [];

    const dayOfWeek = isoDate.getDay();
    const blocks = this.loadBlocks().filter(
      b => b.doctorId === doctorId && b.dayOfWeek === dayOfWeek && b.isActive,
    );
    if (blocks.length === 0) return [];

    // Check for a date-specific exception
    const exception = this.loadExceptions().find(
      e => e.doctorId === doctorId && e.date === date,
    );

    // BLOCKED or EMERGENCY_HOLD wipes out all slots
    if (exception && (exception.type === 'BLOCKED' || exception.type === 'EMERGENCY_HOLD')) {
      return [];
    }

    const bookings = this.loadBookings().filter(
      bk => bk.doctorId === doctorId && bk.date === date,
    );

    const slots: ComputedSlot[] = [];

    for (const block of blocks) {
      const effectiveStart = (exception?.type === 'MODIFIED_HOURS' && exception.startTime)
        ? exception.startTime
        : block.startTime;
      const effectiveEnd = (exception?.type === 'MODIFIED_HOURS' && exception.endTime)
        ? exception.endTime
        : block.endTime;

      const stepMinutes = block.slotDurationMinutes + block.bufferMinutes;
      let cursor = this.toMinutes(effectiveStart);
      const endMinutes = this.toMinutes(effectiveEnd);

      while (cursor + block.slotDurationMinutes <= endMinutes) {
        const slotStart = this.fromMinutes(cursor);
        const slotEnd = this.fromMinutes(cursor + block.slotDurationMinutes);

        const booking = bookings.find(bk => bk.slotStartTime === slotStart);
        const bookedCount = booking?.bookedCount ?? 0;

        slots.push({
          doctorId,
          date,
          startTime: slotStart,
          endTime: slotEnd,
          maxPatients: block.maxPatientsPerSlot,
          bookedCount,
          available: bookedCount < block.maxPatientsPerSlot,
        });

        cursor += stepMinutes;
      }
    }

    return slots;
  }

  // ── Atomic Booking ──────────────────────────────────────────────────────────

  /**
   * Book a slot atomically.
   * Serialises all writes for the same doctor through a per-doctor lock so
   * that concurrent booking requests cannot both pass the capacity check.
   */
  async bookSlot(doctorId: string, date: string, slotStartTime: string): Promise<{ success: boolean; message: string }> {
    // Acquire per-doctor lock
    const prev = this.doctorLocks.get(doctorId) ?? Promise.resolve();
    let release!: () => void;
    const lock = new Promise<void>(resolve => { release = resolve; });
    this.doctorLocks.set(doctorId, prev.then(() => lock));

    try {
      await prev; // Wait for any prior write to finish

      // Re-read fresh from disk inside the lock
      const bookings = this.loadBookings();
      const existing = bookings.find(
        bk => bk.doctorId === doctorId && bk.date === date && bk.slotStartTime === slotStartTime,
      );

      // Determine max capacity from the block
      const isoDate = new Date(date);
      const dayOfWeek = isoDate.getDay();
      const block = this.loadBlocks().find(
        b => b.doctorId === doctorId && b.dayOfWeek === dayOfWeek && b.isActive,
      );
      if (!block) {
        return { success: false, message: 'No availability template found for this doctor on that day.' };
      }

      const bookedCount = existing?.bookedCount ?? 0;
      if (bookedCount >= block.maxPatientsPerSlot) {
        return { success: false, message: 'This slot is already at full capacity.' };
      }

      if (existing) {
        existing.bookedCount += 1;
      } else {
        bookings.push({ doctorId, date, slotStartTime, bookedCount: 1 });
      }

      this.saveBookings(bookings);
      return { success: true, message: 'Slot booked successfully.' };
    } finally {
      release();
    }
  }

  // ── ScheduleBlock CRUD ──────────────────────────────────────────────────────

  getBlocks(doctorId?: string, hospitalId?: string) {
    let blocks = this.loadBlocks();
    if (doctorId) blocks = blocks.filter(b => b.doctorId === doctorId);
    if (hospitalId) blocks = blocks.filter(b => b.hospitalId === hospitalId);
    return ResponseUtil.success('Schedule blocks retrieved', blocks);
  }

  createBlock(dto: CreateScheduleBlockDto, requesterHospitalId?: string) {
    if (requesterHospitalId && dto.hospitalId !== requesterHospitalId) {
      throw new ForbiddenException('Cannot create schedule blocks for a different hospital.');
    }
    if (dto.dayOfWeek < 0 || dto.dayOfWeek > 6) {
      return ResponseUtil.error('dayOfWeek must be 0 (Sun) – 6 (Sat)');
    }
    const block: ScheduleBlock = {
      id: IdGenerator.generate('SB'),
      doctorId: dto.doctorId,
      hospitalId: dto.hospitalId,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      slotDurationMinutes: dto.slotDurationMinutes ?? 15,
      maxPatientsPerSlot: dto.maxPatientsPerSlot ?? 1,
      bufferMinutes: dto.bufferMinutes ?? 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const blocks = this.loadBlocks();
    blocks.push(block);
    this.saveBlocks(blocks);
    return ResponseUtil.success('Schedule block created', block);
  }

  deactivateBlock(blockId: string, requesterHospitalId?: string) {
    const blocks = this.loadBlocks();
    const idx = blocks.findIndex(b => b.id === blockId);
    if (idx === -1) return ResponseUtil.error('Block not found', 404);
    if (requesterHospitalId && blocks[idx].hospitalId !== requesterHospitalId) {
      throw new ForbiddenException('Cannot modify schedule blocks for a different hospital.');
    }
    blocks[idx].isActive = false;
    blocks[idx].updatedAt = new Date().toISOString();
    this.saveBlocks(blocks);
    return ResponseUtil.success('Schedule block deactivated', blocks[idx]);
  }

  // ── ScheduleException CRUD ──────────────────────────────────────────────────

  getExceptions(doctorId?: string, hospitalId?: string) {
    let exceptions = this.loadExceptions();
    if (doctorId) exceptions = exceptions.filter(e => e.doctorId === doctorId);
    if (hospitalId) exceptions = exceptions.filter(e => e.hospitalId === hospitalId);
    return ResponseUtil.success('Schedule exceptions retrieved', exceptions);
  }

  createException(dto: CreateScheduleExceptionDto, requesterHospitalId?: string) {
    if (requesterHospitalId && dto.hospitalId !== requesterHospitalId) {
      throw new ForbiddenException('Cannot create schedule exceptions for a different hospital.');
    }
    const validTypes: ScheduleExceptionType[] = ['BLOCKED', 'MODIFIED_HOURS', 'EMERGENCY_HOLD'];
    if (!validTypes.includes(dto.type)) {
      return ResponseUtil.error(`type must be one of: ${validTypes.join(', ')}`);
    }
    if (dto.type === 'MODIFIED_HOURS' && (!dto.startTime || !dto.endTime)) {
      return ResponseUtil.error('MODIFIED_HOURS exceptions require startTime and endTime');
    }

    const exception: ScheduleException = {
      id: IdGenerator.generate('SE'),
      doctorId: dto.doctorId,
      hospitalId: dto.hospitalId,
      date: dto.date,
      type: dto.type,
      startTime: dto.startTime,
      endTime: dto.endTime,
      reason: dto.reason,
      createdAt: new Date().toISOString(),
    };

    const exceptions = this.loadExceptions();
    // Replace any existing exception for the same doctor+date
    const existingIdx = exceptions.findIndex(e => e.doctorId === dto.doctorId && e.date === dto.date);
    if (existingIdx >= 0) {
      exceptions[existingIdx] = exception;
    } else {
      exceptions.push(exception);
    }
    this.saveExceptions(exceptions);
    return ResponseUtil.success('Schedule exception created', exception);
  }

  deleteException(exceptionId: string, requesterHospitalId?: string) {
    const exceptions = this.loadExceptions();
    const idx = exceptions.findIndex(e => e.id === exceptionId);
    if (idx === -1) return ResponseUtil.error('Exception not found', 404);
    if (requesterHospitalId && exceptions[idx].hospitalId !== requesterHospitalId) {
      throw new ForbiddenException('Cannot delete schedule exceptions for a different hospital.');
    }
    const [deleted] = exceptions.splice(idx, 1);
    this.saveExceptions(exceptions);
    return ResponseUtil.success('Schedule exception deleted', deleted);
  }
}
