import { useCallback, useState } from 'react';
import { Appointments } from '../../api';
import { useToast } from '../../context/ToastContext';

/**
 * Confirm / complete an appointment, then let the page reload its data.
 * Both the dashboard and the appointment list had a copy of this `act()`.
 */
export function useAppointmentActions(reload) {
  const { notify } = useToast();
  const [busyId, setBusyId] = useState(null);

  const act = useCallback(
    async (id, verb) => {
      setBusyId(id);
      try {
        await Appointments[verb](id);
        notify(verb === 'confirm' ? 'Appointment confirmed' : 'Consultation marked complete', 'success');
        await reload();
      } catch (err) {
        notify(err.message || 'Could not update the appointment', 'error');
      } finally {
        setBusyId(null);
      }
    },
    [notify, reload],
  );

  return { act, busyId };
}
