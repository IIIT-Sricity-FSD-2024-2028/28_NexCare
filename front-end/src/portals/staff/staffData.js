import logActivity from '../../features/activity/logActivity';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/authSlice';

// getHospitalId() from every staff script: the signed-in user's hospital. The
// backend scopes staff reads to it from the token anyway; the pages still send
// it as `?hospitalId=` exactly as the HTML did.
export function useHospitalId() {
  const user = useAppSelector(selectUser);
  return user?.hospitalId || '';
}

/** The patient users list — `GET /users?role=patient`, the lookup every staff page shares. */
export function findPatient(patients, idOrName) {
  const wanted = String(idOrName || '').trim().toLowerCase();
  if (!wanted) return null;
  return (patients || []).find((p) =>
    (p.id && p.id.toLowerCase() === wanted)
    || (p.patientId && String(p.patientId).toLowerCase() === wanted)
    || (p.patientIdDisplay && String(p.patientIdDisplay).toLowerCase() === wanted)) || null;
}

export function patientName(p) {
  return p ? (p.fullName || p.name || '') : '';
}

/** `alert()`-style server errors: the ApiError message, else the page's own fallback. */
export function errorMessage(err, fallback) {
  return (typeof err === 'string' && err) || (err && err.message) || fallback;
}

export function useStaffActivity() {
  const dispatch = useAppDispatch();
  return (action, module, details) => dispatch(logActivity(action, module, details));
}
