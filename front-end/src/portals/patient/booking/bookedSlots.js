import { Appointments } from '../../../api';

// Time labels already taken for a doctor on a date (appointments.js
// getBookedSlotsForDoctor). GET /appointments is scoped by the backend to the
// signed-in patient, so — exactly as in the HTML page — this catches the
// patient's own clashes; the server refuses everyone else's at booking time.
export async function bookedSlotsForDoctor(doctorName, dateStr) {
  const booked = new Set();
  if (!doctorName || !dateStr) return booked;
  const normDoc = String(doctorName).toLowerCase().replace(/^dr\.\s*/i, '').trim();
  const normDate = String(dateStr).trim();
  try {
    const res = await Appointments.getAll();
    const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
    list.forEach((a) => {
      if (a.status === 'Cancelled') return;
      const aDoc = String(a.doctor || a.doctorName || '').toLowerCase().replace(/^dr\.\s*/i, '').trim();
      const aDate = String(a.dateLabel || a.date || '').trim();
      if ((aDoc === normDoc || aDoc.includes(normDoc) || normDoc.includes(aDoc))
        && (aDate === normDate || aDate.includes(normDate) || normDate.includes(aDate))) {
        if (a.timeLabel) booked.add(a.timeLabel);
        if (a.time) booked.add(a.time);
      }
    });
  } catch (e) {
    console.warn('API appointments query for booked slots failed:', e);
  }
  return booked;
}
