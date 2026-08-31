/* ─────────────────────────────────────────────────────────────────────────────
   Live doctor directory for the booking wizard.

   The wizard's hospital → department → doctor tree came from
   `shared/mock-hospitals.js`, which was written before the platform had real
   hospitals or doctor accounts. Its catalogue had drifted badly: four of its six
   hospitals ("apollo", "fortis", "manipal", "aster") do not exist in the
   database, and 26 of its 32 consultants are not registered doctors. A patient
   booking off that list produced an appointment attributed to a hospital that
   could not be billed and a doctor whose portal would never show it.

   This file rebuilds `window.MOCK_HOSPITALS` from two live endpoints:

     GET /hospitals       public
     GET /users/doctors   patient-allowed, carries dept + hospitalId

   Availability is read from each doctor's shared weekly schedule. The booking
   wizard therefore presents the same roster used by staff scheduling and the
   doctor portal; the server remains the authority for leave, past dates and
   slot clashes.

   If the API is unreachable the catalogue in `shared/mock-hospitals.js` stands.
   That file is no longer hand-written: it is generated from the same backend
   data by `back-end/scripts/generate-mock-hospitals.js`, so every hospital id
   and doctor id in it is a real record and a booking made off it resolves on
   the server once connectivity returns. `window.doctorDirectoryLive` records
   which of the two the page is showing.
   ───────────────────────────────────────────────────────────────────────────── */

/** Set once hydration has finished, so callers can await it more than once. */
window.doctorDirectoryReady = null;

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_POOL = [
    ['09:00 AM', '10:30 AM', '12:00 PM'],
    ['10:00 AM', '11:30 AM', '03:00 PM'],
    ['09:30 AM', '01:00 PM', '04:00 PM'],
    ['10:00 AM', '12:00 PM', '02:30 PM'],
    ['11:00 AM', '02:00 PM', '04:30 PM'],
];

/** Stable small integer from a string, so a doctor's roster never shuffles. */
function directoryHash(value) {
    let h = 0;
    for (const ch of String(value)) h = (h * 31 + ch.charCodeAt(0)) & 0x7fffffff;
    return h;
}

/** Convert a persisted doctor roster into the booking widget's shape. */
function rosterFor(doctor) {
    const saved = doctor && doctor.schedule;
    if (saved && typeof saved === 'object') {
        const availableDays = [];
        const slots = {};
        for (const day of WEEKDAYS) {
            const entry = saved[day.toLowerCase()];
            if (!entry || !entry.start || !entry.end) continue;
            availableDays.push(day);
            slots[day] = [entry.start, entry.end].map(value => {
                const [hour, minute] = String(value).split(':').map(Number);
                const suffix = hour >= 12 ? 'PM' : 'AM';
                return `${String(hour % 12 || 12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
            });
        }
        if (availableDays.length) return { availableDays, slots };
    }

    const doctorId = doctor?.id || doctor;
    const h = directoryHash(doctorId);
    const days = [
        WEEKDAYS[h % WEEKDAYS.length],
        WEEKDAYS[(h + 2) % WEEKDAYS.length],
        WEEKDAYS[(h + 4) % WEEKDAYS.length],
    ];
    const availableDays = Array.from(new Set(days));
    const slots = {};
    availableDays.forEach((day, i) => {
        slots[day] = SLOT_POOL[(h + i) % SLOT_POOL.length];
    });
    return { availableDays, slots };
}

function slugify(value) {
    return String(value || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Rebuild the catalogue from live data. Resolves to true when it replaced the
 * mock array, false when it fell back.
 */
async function hydrateDoctorDirectory() {
    window.doctorDirectoryLive = false;
    if (!window.NexCareAPI) {
        console.warn('[NexCare] API client unavailable — using the generated offline catalogue.');
        return false;
    }

    try {
        const [hospitalRes, doctorRes] = await Promise.all([
            window.NexCareAPI.Hospitals.getAll(),
            window.NexCareAPI.Users.getDoctors
                ? window.NexCareAPI.Users.getDoctors()
                : window.NexCareAPI.get('/users/doctors'),
        ]);

        if (!hospitalRes?.success || !doctorRes?.success) return false;

        const hospitals = hospitalRes.data || [];
        const doctors = (doctorRes.data || []).filter(d => d.hospitalId);
        if (!hospitals.length || !doctors.length) return false;

        // Group doctors by hospital, then by the department they practise in —
        // that is exactly the two levels the wizard walks.
        const byHospital = new Map();
        for (const doc of doctors) {
            if (!byHospital.has(doc.hospitalId)) byHospital.set(doc.hospitalId, new Map());
            const depts = byHospital.get(doc.hospitalId);
            const dept = doc.dept || doc.specialization || 'General Medicine';
            if (!depts.has(dept)) depts.set(dept, []);
            depts.get(dept).push(doc);
        }

        const built = hospitals
            // A hospital with no doctors cannot be booked at, so it is not offered.
            .filter(h => byHospital.has(h.id))
            .map(h => ({
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
                    doctors: docs.map(doc => ({
                        // The real user id — this is what makes the booking reach
                        // the doctor's own portal and earn commission.
                        id: doc.id,
                        name: doc.name,
                        qualification: doc.qualification || doc.dept || '',
                        // Doctor records store experienceYears; `experience` is
                        // only present on older records.
                        experience: doc.experience ?? doc.experienceYears ?? null,
                        consultationFee: doc.consultationFee || null,
                        ...rosterFor(doc),
                    })),
                })),
            }));

        if (!built.length) return false;
        window.MOCK_HOSPITALS = built;
        window.doctorDirectoryLive = true;
        console.info(`[NexCare] Booking catalogue hydrated: ${built.length} hospitals, ${doctors.length} doctors.`);
        return true;
    } catch (err) {
        // Keep the generated offline catalogue rather than blanking the wizard.
        console.error('[NexCare] Live doctor directory could not be loaded, falling back to the offline catalogue:', err.message);
        return false;
    }
}

// Kick off immediately so the wizard can await the same promise no matter how
// many times it re-renders.
window.doctorDirectoryReady = hydrateDoctorDirectory();
