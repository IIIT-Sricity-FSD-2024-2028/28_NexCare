export type HospitalScheduleStatus = 'pending' | 'approved' | 'rejected';

export interface ScheduleSlot {
  department: string;
  shift: string;
  startTime: string;
  endTime: string;
}

export interface HospitalSchedule {
  id: string;
  hospitalId: string;
  hospitalName?: string;
  validFrom: string;
  validTo: string;
  slots: ScheduleSlot[];
  notes?: string;
  status: HospitalScheduleStatus;
  submittedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHospitalScheduleDto {
  hospitalId: string;
  hospitalName?: string;
  validFrom: string;
  validTo: string;
  slots: ScheduleSlot[];
  notes?: string;
  submittedBy?: string;
}

export interface UpdateHospitalScheduleDto {
  status: HospitalScheduleStatus;
  approvedBy?: string;
  rejectionReason?: string;
}

// ─── Doctor Scheduling (Two-Layer Model) ───────────────────────────────────────
//
// Layer 1 — Recurring availability template (per doctor, per day-of-week).
// Generates the base bookable slots for each week.
//
// Layer 2 — Exception/override (per doctor, specific date).
// Blocks out emergency surgeries, modified hours, personal leave etc.
//
// Resolution rule:
//   available_slots(doctor, date) =
//     generate_from_template(doctor, dayOfWeek(date))
//     minus/override exceptions on that exact date

/** A recurring weekly availability block for a specific doctor. */
export interface ScheduleBlock {
  id: string;
  doctorId: string;
  hospitalId: string;
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  startTime: string;              // "08:00"
  endTime: string;                // "16:00"
  slotDurationMinutes: number;    // e.g. 15 — drives slot generation
  maxPatientsPerSlot: number;     // usually 1; supports group consults
  bufferMinutes: number;          // gap between appointments (default 0)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ScheduleExceptionType = 'BLOCKED' | 'MODIFIED_HOURS' | 'EMERGENCY_HOLD';

/** A date-specific override that modifies or cancels recurring availability. */
export interface ScheduleException {
  id: string;
  doctorId: string;
  hospitalId: string;
  /** ISO date string for the specific date, e.g. "2026-09-15" */
  date: string;
  type: ScheduleExceptionType;
  /** Only meaningful for MODIFIED_HOURS — the new window for that day. */
  startTime?: string;
  endTime?: string;
  reason?: string;
  createdAt: string;
}

/** A computed, bookable slot derived from a ScheduleBlock. */
export interface ComputedSlot {
  doctorId: string;
  date: string;              // ISO date
  startTime: string;         // "08:00"
  endTime: string;           // "08:15"
  maxPatients: number;
  bookedCount: number;
  available: boolean;        // bookedCount < maxPatients
}

export interface CreateScheduleBlockDto {
  doctorId: string;
  hospitalId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes?: number;   // default 15
  maxPatientsPerSlot?: number;    // default 1
  bufferMinutes?: number;         // default 0
}

export interface CreateScheduleExceptionDto {
  doctorId: string;
  hospitalId: string;
  date: string;
  type: ScheduleExceptionType;
  startTime?: string;
  endTime?: string;
  reason?: string;
}
