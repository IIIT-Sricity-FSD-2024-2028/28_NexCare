/**
 * Regenerates front-end/shared/mock-hospitals.js from the seeded backend data.
 *
 * `mock-hospitals.js` is the offline catalogue the patient booking wizard falls
 * back to when the live API cannot be reached. It was previously hand-written,
 * and drifted: after the H001–H008 reseed it listed 15 doctors against the
 * backend's 48, leaving seven of the eight hospitals with a single department
 * holding a single doctor.
 *
 * Generating it from data/users.json + data/hospitals.json keeps the fallback a
 * faithful mirror of the live roster — same hospital IDs, same doctor user IDs
 * — so a booking made off it reaches the doctor's own portal. Re-run this after
 * any reseed:
 *
 *   node scripts/generate-mock-hospitals.js
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT = path.join(__dirname, '..', '..', 'front-end', 'shared', 'mock-hospitals.js');

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const read = (file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));

/** '08:00' -> '08:00 AM'. Mirrors the same conversion in doctor-directory.js. */
function to12Hour(value) {
  const [hour, minute] = String(value).split(':').map(Number);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${String(hour % 12 || 12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
}

/** Turn a doctor's persisted weekly schedule into the wizard's days + slots shape. */
function rosterFor(doctor) {
  const availableDays = [];
  const slots = {};
  const schedule = doctor.schedule || {};
  for (const day of WEEKDAYS) {
    const entry = schedule[day.toLowerCase()];
    if (!entry || !entry.start || !entry.end) continue;
    availableDays.push(day);
    slots[day] = [entry.start, entry.end].map(to12Hour);
  }
  return { availableDays, slots };
}

const slugify = (value) =>
  String(value || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const hospitals = read('hospitals.json');
const doctors = read('users.json').filter((u) => u.role === 'doctor' && u.hospitalId);

const byHospital = new Map();
for (const doc of doctors) {
  if (!byHospital.has(doc.hospitalId)) byHospital.set(doc.hospitalId, new Map());
  const departments = byHospital.get(doc.hospitalId);
  const dept = doc.dept || doc.department || doc.specialization || 'General Medicine';
  if (!departments.has(dept)) departments.set(dept, []);
  departments.get(dept).push(doc);
}

const catalogue = hospitals
  // A hospital with no doctors cannot be booked at, so it is not offered.
  .filter((h) => byHospital.has(h.id))
  .map((h) => ({
    id: h.id,
    name: h.name,
    city: h.city,
    pincode: h.pincode,
    address: `${h.address}, ${h.state}`,
    phone: h.phone,
    emergencyAvailable: h.emergency24x7 !== false,
    verificationStatus: h.verificationStatus,
    availableBeds: h.availableBeds,
    totalBeds: h.totalBeds,
    specialities: Array.from(byHospital.get(h.id).keys()),
    departments: Array.from(byHospital.get(h.id).entries()).map(([name, docs]) => ({
      id: slugify(name),
      name,
      doctors: docs.map((doc) => ({
        // The real user id — this is what makes a booking reach the doctor's
        // own portal and earn commission.
        id: doc.id,
        name: doc.name,
        qualification: doc.qualification || '',
        experience: doc.experienceYears ?? null,
        consultationFee: doc.consultationFee ?? null,
        ...rosterFor(doc),
      })),
    })),
  }));

const banner = `// Reusable Mock Hospital & Doctor Data for NexCare Frontend
// Structured Hierarchy: Hospital -> Departments -> Doctors -> Availability & Slots
//
// GENERATED FILE — do not edit by hand.
// Regenerate with:  node back-end/scripts/generate-mock-hospitals.js
// Source of truth:  back-end/data/hospitals.json + back-end/data/users.json
//
// This is the offline fallback for the patient booking wizard. Every hospital
// id and doctor id here is a real record, so a booking made against it resolves
// on the server once connectivity returns.

`;

fs.writeFileSync(
  OUTPUT,
  `${banner}window.MOCK_HOSPITALS = ${JSON.stringify(catalogue, null, 2)};\n`,
  'utf8',
);

const doctorCount = catalogue.reduce(
  (sum, h) => sum + h.departments.reduce((n, d) => n + d.doctors.length, 0),
  0,
);
console.log(
  `Wrote ${path.relative(path.join(__dirname, '..', '..'), OUTPUT)}: ` +
  `${catalogue.length} hospitals, ${doctorCount} doctors.`,
);
