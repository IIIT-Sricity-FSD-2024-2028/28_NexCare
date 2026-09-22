/**
 * The buttons a doctor gets on one appointment row. Confirm and Complete are
 * the only status changes a doctor may make — cancelling is the patient's or
 * the front desk's call. Refer opens the referral flow on a seen patient.
 */
export default function AppointmentActions({ apt, onAct, onRefer, busy, completeLabel = 'Complete' }) {
  const buttons = [];
  if (apt.status === 'Pending') {
    buttons.push(
      <button key="confirm" type="button" className="btn primary" disabled={busy} onClick={() => onAct(apt.id, 'confirm')}>
        Confirm
      </button>,
    );
  }
  if (apt.status === 'Confirmed') {
    buttons.push(
      <button key="complete" type="button" className="btn" disabled={busy} onClick={() => onAct(apt.id, 'complete')}>
        {completeLabel}
      </button>,
    );
  }
  if (apt.status === 'Confirmed' || apt.status === 'Completed') {
    buttons.push(
      <button key="refer" type="button" className="btn" style={{ marginLeft: 4 }} disabled={busy} onClick={() => onRefer(apt)}>
        Refer
      </button>,
    );
  }
  return buttons.length ? <>{buttons}</> : <span className="muted">—</span>;
}
