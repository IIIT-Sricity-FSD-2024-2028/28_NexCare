import { useCallback, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAppDispatch } from '../../store/hooks';
import { updateAppointmentStatus } from '../../store/doctorSlice';

/**
 * Confirm / complete an appointment through the doctor slice. The slice
 * patches the row's status in place; `reload` (optional) refreshes anything
 * derived on the server, such as the dashboard stats.
 */
export function useAppointmentActions(reload) {
  const dispatch = useAppDispatch();
  const { notify } = useToast();
  const [busyId, setBusyId] = useState(null);

  const act = useCallback(
    async (id, verb) => {
      setBusyId(id);
      try {
        await dispatch(updateAppointmentStatus({ id, verb })).unwrap();
        notify(verb === 'confirm' ? 'Appointment confirmed' : 'Consultation marked complete', 'success');
        if (reload) await reload();
      } catch (err) {
        notify(typeof err === 'string' ? err : err?.message || 'Could not update the appointment', 'error');
      } finally {
        setBusyId(null);
      }
    },
    [dispatch, notify, reload],
  );

  return { act, busyId };
}
