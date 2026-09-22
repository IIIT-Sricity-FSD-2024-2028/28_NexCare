// The hospital's published OPD roster, as the booking wizard needs it: which
// minutes of a given date a department is open. This mirrors the backend's
// SchedulesService.isPublishedCoverage() so the wizard only ever offers a slot
// the server would accept — before this, the doctor's roster ran to 17:00 while
// every published shift closed at 16:00, and the last slot of each day was
// refused with "That slot is outside the published hospital schedule."
import { Schedules } from '../../api';

const MINUTES_IN_DAY = 24 * 60;

/** Published (approved) rosters for one hospital. Throws when the API fails. */
export async function loadPublishedSchedules(hospitalId) {
  if (!hospitalId) return [];
  const res = await Schedules.getAll({ hospitalId, status: 'approved' });
  const rows = Array.isArray(res.data) ? res.data : [];
  // Patients only ever get approved rows back, but the filter is cheap and
  // keeps this correct for any role that reuses it.
  return rows.filter((s) => s.status === 'approved' && s.hospitalId === hospitalId);
}

/** 'HH:MM' or 'hh:mm AM' → minutes since midnight, or null (parseTimeMinutes). */
export function timeToMinutes(label) {
  if (!label) return null;
  const text = String(label).trim();
  const ampm = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let hours = Number(ampm[1]);
    const mer = ampm[3].toUpperCase();
    if (mer === 'PM' && hours !== 12) hours += 12;
    if (mer === 'AM' && hours === 12) hours = 0;
    return hours * 60 + Number(ampm[2]);
  }
  const h24 = text.match(/^(\d{1,2}):(\d{2})$/);
  return h24 ? Number(h24[1]) * 60 + Number(h24[2]) : null;
}

/** Minutes since midnight → 'hh:mm AM', the label format appointments store. */
export function minutesToLabel(minutes) {
  const total = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${String(hour % 12 || 12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
}

// Local-midnight date from 'YYYY-MM-DD' (the backend does new Date(value) then
// setHours(0) — in the browser that would shift a day west of Greenwich).
function localDate(value) {
  const [y, m, d] = String(value || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  const parsed = new Date(y, m - 1, d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * The open windows (`[startMinutes, endMinutes)`, same day) a department has on
 * a date, across every published roster that covers it. A shift that wraps past
 * midnight ('20:00'–'08:00') is split into its evening and morning halves, which
 * is what the backend's timeInShift() accepts. `[]` when nothing is published
 * for that department on that date.
 */
export function publishedWindows(schedules, department, dateStr) {
  const date = localDate(dateStr);
  if (!date || !Array.isArray(schedules)) return [];
  const windows = [];
  for (const schedule of schedules) {
    if (schedule.status !== 'approved') continue;
    const from = localDate(schedule.validFrom);
    const to = localDate(schedule.validTo);
    if (!from || !to || date < from || date > to) continue;
    for (const slot of schedule.slots || []) {
      const deptOk = !department || slot.department === department || slot.department === 'All';
      if (!deptOk) continue;
      const start = timeToMinutes(slot.startTime);
      const end = timeToMinutes(slot.endTime);
      if (start === null || end === null) { windows.push([0, MINUTES_IN_DAY]); continue; }
      if (end > start) windows.push([start, end]);
      else { windows.push([start, MINUTES_IN_DAY]); windows.push([0, end]); }
    }
  }
  return windows;
}

/** True when a 'hh:mm AM' label falls inside one of the windows. */
export function withinWindows(windows, timeLabel) {
  const minutes = timeToMinutes(timeLabel);
  if (minutes === null) return false;
  return windows.some(([start, end]) => minutes >= start && minutes < end);
}
