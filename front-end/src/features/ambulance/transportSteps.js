// The ambulance transport lifecycle, keyed on the backend's AmbulanceStatus
// values. ambulance/app.js kept a parallel `stepIndex` counter and a
// STEP_TO_BACKEND_STATUS table that were offset from each other by one, so
// the tracker showed "Pending" while the server said En Route, and "Update to
// Next Step" sent `Completed` at step 4 (charging the patient) and then
// `En Route` again at step 5. Here the server status is the only state.

/** The tracker rows, in order. `status` is the AmbulanceStatus that marks the step reached. */
export const TRANSPORT_STEPS = [
  { status: 'Dispatched', label: 'Dispatch Accepted', etaMinutes: 8 },
  { status: 'En Route', label: 'Ambulance En Route', etaMinutes: 12 },
  { status: 'Picked Up', label: 'Patient Picked Up', etaMinutes: 5 },
  { status: 'At Hospital', label: 'Reached Hospital', etaMinutes: 15 },
  { status: 'Completed', label: 'Transport Completed', etaMinutes: 0 },
];

const IN_TRANSIT = ['En Route', 'Picked Up', 'At Hospital'];

/** pending | assigned | in_transit | completed | cancelled — the buckets the portal's pages are built on. */
export function bucketOf(status) {
  const s = String(status || 'Pending');
  if (s === 'Pending') return 'pending';
  if (s === 'Dispatched') return 'assigned';
  if (IN_TRANSIT.includes(s)) return 'in_transit';
  if (s === 'Cancelled') return 'cancelled';
  return 'completed';
}

export const isPending = (r) => bucketOf(r.status) === 'pending';
export const isAssigned = (r) => bucketOf(r.status) === 'assigned';
export const isInTransit = (r) => bucketOf(r.status) === 'in_transit';
export const isCompleted = (r) => bucketOf(r.status) === 'completed';
export const isHistory = (r) => ['completed', 'cancelled'].includes(bucketOf(r.status));

/** Index into TRANSPORT_STEPS for a status (Pending → -1, unknown → 0). */
export function stepIndexOf(status) {
  const i = TRANSPORT_STEPS.findIndex((s) => s.status === status);
  return status === 'Pending' ? -1 : Math.max(0, i);
}

/**
 * The status "Update to Next Step" moves an in-transit request to, or null
 * when the next move is completion (which goes through PATCH /:id/complete
 * so the backend raises the transport charge exactly once).
 */
export function nextStatus(status) {
  const i = stepIndexOf(status);
  const next = TRANSPORT_STEPS[i + 1];
  return next && next.status !== 'Completed' ? next.status : null;
}

export const isFinalStep = (status) => status === 'At Hospital';

/** Minutes the current step is expected to take (the ETA countdown). */
export function etaMinutesFor(status) {
  const step = TRANSPORT_STEPS[stepIndexOf(status)];
  return step ? step.etaMinutes : 0;
}

export const BUCKET_LABEL = { pending: 'Pending', assigned: 'Assigned', in_transit: 'Active', completed: 'Completed', cancelled: 'Cancelled' };
export const BUCKET_BADGE = { pending: 'badge-orange', assigned: 'badge-blue', in_transit: 'badge-teal', completed: 'badge-green', cancelled: 'badge-gray' };

/** The seed never sets `priority`; app.js defaulted it to Medium. */
export const priorityOf = (r) => {
  const p = String(r.priority || 'Medium');
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
};

/** "10:32 AM" from createdAt, as app.js formatted the request time. */
export function requestTime(r) {
  if (!r.createdAt) return '—';
  const d = new Date(r.createdAt);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** The completion stamps app.js wrote (completedDate "September 20, 2026", completedTime "3:05 PM"). */
export function completionStamps(now = new Date()) {
  return {
    completedDate: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    completedTime: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
  };
}
