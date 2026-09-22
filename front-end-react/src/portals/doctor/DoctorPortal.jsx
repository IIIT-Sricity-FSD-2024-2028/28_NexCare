import { useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import { Users } from '../../api';

const DIRECTORY_FIELDS = [
  'dept', 'department', 'specialization', 'consultationFee', 'experienceYears',
  'qualification', 'consultationTiming', 'medicalRegNumber', 'employeeId', 'hospitalName',
];

/**
 * The doctor portal shell. The login payload carries only the session basics;
 * the directory record (department, specialisation, fee, qualification,
 * timings) is what the dashboard summarises, so it is fetched once from
 * /users/doctors and merged into the cached user for every doctor page.
 */
export default function DoctorPortal() {
  const { user, updateUser } = useAuth();

  useEffect(() => {
    if (!user?.id || user.dept) return undefined;
    let cancelled = false;
    Users.getDoctors()
      .then((res) => {
        if (cancelled) return;
        const me = (res?.data || []).find((d) => String(d.id) === String(user.id));
        if (!me) return;
        const patch = Object.fromEntries(
          DIRECTORY_FIELDS.filter((k) => me[k] !== undefined && me[k] !== null && user[k] === undefined).map((k) => [k, me[k]]),
        );
        if (Object.keys(patch).length) updateUser(patch);
      })
      .catch(() => { /* the summary card falls back to its defaults */ });
    return () => { cancelled = true; };
  }, [user, updateUser]);

  return <PortalLayout />;
}
