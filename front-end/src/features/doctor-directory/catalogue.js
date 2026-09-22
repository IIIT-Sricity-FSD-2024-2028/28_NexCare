// The booking wizard's hospital → department → doctor catalogue, built from
// live data. A port of front-end/shared/doctor-directory.js; the offline
// fallback array in shared/mock-hospitals.js (1,965 generated lines) is NOT
// ported — without the API the wizard shows "unavailable" instead of a stale
// catalogue (progress.md, Phase 2 decisions).
//
//   hospital   = { id, name, city, pincode, address, phone, emergencyAvailable,
//                  verificationStatus, availableBeds, totalBeds, specialities[],
//                  departments[] }
//   department = { id (slug), name, doctors[] }
//   doctor     = { id, name, qualification, experience, consultationFee,
//                  availableDays[], hours{ weekday: [startMin, endMin] } | null,
//                  slots{ weekday: [...] } }
import { Hospitals, Users } from '../../api';
import { minutesToLabel, publishedWindows, timeToMinutes, withinWindows } from './hospitalSchedule';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_POOL = [
  ['09:00 AM', '10:30 AM', '12:00 PM'],
  ['10:00 AM', '11:30 AM', '03:00 PM'],
  ['09:30 AM', '01:00 PM', '04:00 PM'],
  ['10:00 AM', '12:00 PM', '02:30 PM'],
  ['11:00 AM', '02:00 PM', '04:30 PM'],
];
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/** Consultation slots are offered every half hour of a doctor's working window. */
export const SLOT_STEP_MINUTES = 30;

/** Stable small integer from a string, so a doctor's roster never shuffles. */
function directoryHash(value) {
  let h = 0;
  for (const ch of String(value)) h = (h * 31 + ch.charCodeAt(0)) & 0x7fffffff;
  return h;
}

/**
 * A doctor's weekly availability. With a saved roster, `hours` holds each
 * working day's window in minutes and the slot list is derived from it at
 * booking time (slotsForDoctor); without one, a deterministic template seeded
 * off the id supplies fixed slots. Display only — the server still refuses
 * past dates, leave days and slot clashes.
 */
function rosterFor(doctor) {
  const saved = doctor && doctor.schedule;
  if (saved && typeof saved === 'object') {
    const availableDays = [];
    const hours = {};
    for (const day of WEEKDAYS) {
      const entry = saved[day.toLowerCase()];
      if (!entry || !entry.start || !entry.end) continue;
      const start = timeToMinutes(entry.start);
      const end = timeToMinutes(entry.end);
      if (start === null || end === null || end <= start) continue;
      availableDays.push(day);
      hours[day] = [start, end];
    }
    if (availableDays.length) return { availableDays, hours, slots: {} };
  }

  const h = directoryHash(doctor?.id || doctor);
  const availableDays = Array.from(new Set([
    WEEKDAYS[h % WEEKDAYS.length],
    WEEKDAYS[(h + 2) % WEEKDAYS.length],
    WEEKDAYS[(h + 4) % WEEKDAYS.length],
  ]));
  const slots = {};
  availableDays.forEach((day, i) => { slots[day] = SLOT_POOL[(h + i) % SLOT_POOL.length]; });
  return { availableDays, hours: null, slots };
}

export function slugify(value) {
  return String(value || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** GET /hospitals + GET /users/doctors → the catalogue. Throws when either fails. */
export async function loadCatalogue() {
  const [hospitalRes, doctorRes] = await Promise.all([Hospitals.getAll(), Users.getDoctors()]);
  const hospitals = hospitalRes.data || [];
  const doctors = (doctorRes.data || []).filter((d) => d.hospitalId);

  // Group doctors by hospital, then by department — the two levels the wizard walks.
  const byHospital = new Map();
  for (const doc of doctors) {
    if (!byHospital.has(doc.hospitalId)) byHospital.set(doc.hospitalId, new Map());
    const depts = byHospital.get(doc.hospitalId);
    const dept = doc.dept || doc.specialization || 'General Medicine';
    if (!depts.has(dept)) depts.set(dept, []);
    depts.get(dept).push(doc);
  }

  return hospitals
    // A hospital with no doctors cannot be booked at, so it is not offered.
    .filter((h) => byHospital.has(h.id))
    .map((h) => ({
      id: h.id,
      name: h.name,
      city: h.city,
      pincode: h.pincode,
      address: h.address,
      phone: h.phone || h.adminPhone,
      emergencyAvailable: h.emergencyAvailable !== false,
      verificationStatus: h.verificationStatus,
      availableBeds: h.availableBeds,
      totalBeds: h.totalBeds,
      specialities: Array.from(byHospital.get(h.id).keys()),
      departments: Array.from(byHospital.get(h.id).entries()).map(([name, docs]) => ({
        id: slugify(name),
        name,
        doctors: docs.map((doc) => ({
          id: doc.id, // the real user id — what routes the booking to the doctor's portal
          name: doc.name,
          qualification: doc.qualification || doc.dept || '',
          experience: doc.experience ?? doc.experienceYears ?? null,
          consultationFee: doc.consultationFee || null,
          ...rosterFor(doc),
        })),
      })),
    }));
}

/**
 * The weekday a `YYYY-MM-DD` value falls on, in the viewer's own timezone —
 * `new Date('2026-09-10')` would parse as UTC midnight, the previous day west
 * of Greenwich, and silently offer the wrong roster.
 */
export function weekdayOfDate(dateStr) {
  const [y, m, d] = String(dateStr || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  const parsed = new Date(y, m - 1, d);
  return Number.isNaN(parsed.getTime()) ? null : WEEKDAY_NAMES[parsed.getDay()];
}

export function findHospital(catalogue, idOrName) {
  if (!idOrName) return null;
  return (catalogue || []).find((h) => h.id === idOrName || h.name === idOrName) || null;
}

export function findDepartment(hospital, dept) {
  if (!hospital || !Array.isArray(hospital.departments) || !dept) return null;
  const wanted = String(dept).toLowerCase();
  const wantedSlug = slugify(dept);
  return hospital.departments.find((d) => {
    if (typeof d === 'string') return d.toLowerCase() === wanted;
    return String(d.name || '').toLowerCase() === wanted || String(d.id || '').toLowerCase() === wanted || slugify(d.name) === wantedSlug;
  }) || null;
}

/** Department names a hospital offers, for the wizard's step 1. */
export function departmentsOf(hospital) {
  if (!hospital) return [];
  if (Array.isArray(hospital.departments) && hospital.departments.length) {
    return hospital.departments.map((d) => (typeof d === 'string' ? d : d.name || d.id));
  }
  return Array.isArray(hospital.specialities) ? hospital.specialities : [];
}

/** The consultants in one department who work on the given date ([] if none). */
export function availableDoctorsForDate(catalogue, hospitalId, dept, dateStr) {
  const weekday = weekdayOfDate(dateStr);
  if (!weekday) return [];
  const department = findDepartment(findHospital(catalogue, hospitalId), dept);
  if (!department || !Array.isArray(department.doctors)) return [];
  return department.doctors.filter((doc) => Array.isArray(doc.availableDays) && doc.availableDays.includes(weekday));
}

/**
 * One doctor's slot list for that date.
 *
 * With the hospital's published rosters (`schedules`, from
 * loadPublishedSchedules) the list is the doctor's working window on that
 * weekday cut into SLOT_STEP_MINUTES steps and trimmed to the hours the
 * hospital has actually published for the department — exactly the set the
 * server's isPublishedCoverage() will accept. Pass `null` for `schedules` when
 * they could not be loaded: the doctor's own window is then offered untrimmed
 * and the server has the final say, as before.
 */
export function slotsForDoctor(catalogue, hospitalId, dept, doctorIdOrName, dateStr, schedules = null) {
  const weekday = weekdayOfDate(dateStr);
  if (!weekday || !doctorIdOrName) return [];
  const department = findDepartment(findHospital(catalogue, hospitalId), dept);
  if (!department || !Array.isArray(department.doctors)) return [];
  const doctor = department.doctors.find((d) => d.id === doctorIdOrName || d.name === doctorIdOrName);
  if (!doctor) return [];

  let offered;
  if (doctor.hours && doctor.hours[weekday]) {
    const [start, end] = doctor.hours[weekday];
    offered = [];
    for (let m = start; m < end; m += SLOT_STEP_MINUTES) offered.push(minutesToLabel(m));
  } else {
    offered = Array.isArray(doctor.slots?.[weekday]) ? doctor.slots[weekday].slice() : [];
  }
  if (!Array.isArray(schedules)) return offered;

  const windows = publishedWindows(schedules, department.name, dateStr);
  return offered.filter((label) => withinWindows(windows, label));
}
