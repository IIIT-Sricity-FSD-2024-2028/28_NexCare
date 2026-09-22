import { useCallback, useEffect, useState } from 'react';
import { Feedback, Hospitals } from '../../api';
import { ConfirmDialog } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { usePatient } from './PatientContext';

// patient/feedback.html + feedback.js.
//
// Two tabs: submit (or edit) a submission, and the list of your own. The
// hospital picker is required — feedback with no hospital used to land in the
// Admin's queue as "Unknown Hospital" and could not be routed.

const CATEGORIES = [
  ['billing', 'Billing/Payment Issue'],
  ['appointment', 'Appointment/Scheduling'],
  ['staff', 'Staff Behavior'],
  ['facilities', 'Facilities/Cleanliness'],
  ['medical', 'Medical Care Quality'],
  ['wait-time', 'Wait Time'],
  ['other', 'Other'],
];

const BADGES = { Open: 'badge-open', 'In Progress': 'badge-in-progress', Resolved: 'badge-resolved' };
const EMPTY = { hospitalId: '', category: '', description: '', rating: 0 };

export default function FeedbackPage() {
  const { notify } = useToast();
  const { patientId, patient, displayName } = usePatient();

  const [tab, setTab] = useState('submit');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [hospitals, setHospitals] = useState(null); // null = loading
  const [items, setItems] = useState([]);
  const [confirm, setConfirm] = useState(null);

  const loadSubmissions = useCallback(async () => {
    if (!patientId) return;
    try {
      setItems((await Feedback.getByPatient(patientId)).data || []);
    } catch (err) {
      console.warn('Could not load submissions:', err.message);
      setItems([]);
    }
  }, [patientId]);

  useEffect(() => { loadSubmissions(); }, [loadSubmissions]);

  // Only somewhere actually on the platform can act on a complaint.
  useEffect(() => {
    let cancelled = false;
    Hospitals.getAll()
      .then((res) => {
        if (cancelled) return;
        const list = (res.data || [])
          .filter((h) => (h.verificationStatus || 'verified') === 'verified')
          .sort((a, b) => String(a.name).localeCompare(String(b.name)));
        setHospitals(list);
      })
      .catch((err) => {
        console.warn('Could not load hospitals for the feedback picker:', err.message);
        if (!cancelled) setHospitals([]);
      });
    return () => { cancelled = true; };
  }, []);

  // The patient's own hospital is nearly always the one they mean, but they may
  // be reviewing somewhere they were referred to, so it is only a preselection.
  const ownHospitalId = patient?.hospitalId || null;
  useEffect(() => {
    if (!editingId && ownHospitalId) setForm((f) => (f.hospitalId ? f : { ...f, hospitalId: ownHospitalId }));
  }, [ownHospitalId, editingId]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const hospitalName = (id) => hospitals?.find((h) => h.id === id)?.name || id || 'Not specified';
  const ownHospital = hospitals?.find((h) => h.id === ownHospitalId);

  async function submit(e) {
    e.preventDefault();
    const { hospitalId, category, description, rating } = form;
    if (!hospitalId) return notify('Please select the hospital this feedback is about', 'error');
    if (!category) return notify('Please select a feedback category', 'error');
    if (!description || description.trim().length < 10) return notify('Please provide more detail (at least 10 characters)', 'error');
    if (!rating) return notify('Please rate your experience by selecting stars', 'error');

    try {
      let refId;
      if (editingId) {
        await Feedback.update(editingId, { hospitalId, category, summary: description.trim(), rating, status: 'Open' });
        refId = editingId;
        notify(`Feedback updated successfully! Reference ID: ${refId}`, 'success');
      } else {
        const res = await Feedback.create({
          patientId,
          sender: displayName,
          type: 'Patient',
          category,
          subject: `${category} Feedback`,
          summary: description.trim(),
          hospitalId,
          rating: Number(rating) || 1,
        });
        refId = res.data?.id;
        notify(`Feedback submitted successfully! Reference ID: ${refId}`, 'success');
      }
      setForm({ ...EMPTY, hospitalId: ownHospitalId || '' });
      setEditingId(null);
      await loadSubmissions();
      setTimeout(() => setTab('submissions'), 500);
    } catch (err) {
      notify(err.message || 'Could not submit your feedback', 'error');
    }
  }

  function edit(item) {
    setEditingId(item.id);
    setForm({
      hospitalId: item.hospitalId || '',
      category: item.category || '',
      description: item.summary ?? item.description ?? '',
      rating: Number(item.rating || 0),
    });
    setTab('submit');
  }

  async function remove(id) {
    try {
      await Feedback.delete(id);
      await loadSubmissions();
    } catch (err) {
      notify(err.message || 'Could not delete the submission', 'error');
    }
  }

  async function resolve(id) {
    try {
      await Feedback.update(id, { status: 'Resolved' });
      await loadSubmissions();
    } catch (err) {
      notify(err.message || 'Could not update the submission', 'error');
    }
  }

  return (
    <main className="main-content feedback-page">
      <div className="feedback-header">
        <div className="feedback-title">
          <h1>Feedback &amp; Complaints</h1>
          <p>We value your feedback. Please share your experience.</p>
        </div>
      </div>

      <div className="feedback-content">
        <div className="feedback-tabs">
          <button type="button" className={`tab-btn${tab === 'submit' ? ' active' : ''}`} onClick={() => setTab('submit')}>Submit Feedback/Complaint</button>
          <button type="button" className={`tab-btn${tab === 'submissions' ? ' active' : ''}`} onClick={() => setTab('submissions')}>My Submissions</button>
        </div>

        <div id="submitTab" className={`tab-content${tab === 'submit' ? ' active' : ''}`}>
          <form id="feedbackForm" className="feedback-form" autoComplete="off" onSubmit={submit}>
            <div className="form-group">
              <label htmlFor="hospitalId">Which hospital is this about? *</label>
              <select id="hospitalId" name="hospitalId" required value={form.hospitalId} onChange={set('hospitalId')}>
                {hospitals === null && <option value="">Loading hospitals…</option>}
                {hospitals !== null && hospitals.length === 0 && <option value="">Could not load hospitals — please try again</option>}
                {hospitals !== null && hospitals.length > 0 && <option value="">Select a hospital</option>}
                {(hospitals || []).map((h) => (
                  <option key={h.id} value={h.id}>{h.city ? `${h.name} — ${h.city}` : h.name}</option>
                ))}
              </select>
              <small id="hospitalHint" className="char-count" style={{ display: 'block', marginTop: 6 }}>
                {hospitals !== null && hospitals.length === 0
                  ? 'The hospital list is unavailable, so feedback cannot be routed right now.'
                  : ownHospital
                    ? `Preselected your registered hospital (${ownHospital.name}). Change it if your feedback is about somewhere else.`
                    : 'Choose the hospital your feedback is about.'}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="category">Select Category *</label>
              <select id="category" name="category" required value={form.category} onChange={set('category')}>
                <option value="">Select a category</option>
                {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Describe your experience *</label>
              <textarea id="description" name="description" rows={8} maxLength={500} required placeholder="Please describe your feedback or complaint in detail..." value={form.description} onChange={set('description')} />
              <div className="char-count"><span id="charCount">{form.description.length}</span>/500</div>
            </div>

            <div className="form-group">
              <label>Rate your experience *</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} className="star-btn" data-rating={n} aria-label={`${n} star`} onClick={() => setForm((f) => ({ ...f, rating: n }))}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={n <= form.rating ? '#FDB022' : '#D1D5DC'} strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={n <= form.rating ? '#FDB022' : 'none'} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-submit-feedback">{editingId ? 'Update' : 'Submit'}</button>
          </form>
        </div>

        <div id="submissionsTab" className={`tab-content${tab === 'submissions' ? ' active' : ''}`}>
          <div className="submissions-list">
            {items.length === 0 && (
              <div className="submission-card">
                <div className="submission-header">
                  <div className="submission-info"><h3>No submissions</h3><p>Create one in the Submit tab.</p></div>
                </div>
              </div>
            )}
            {items.map((it) => (
              <div className="submission-card" key={it.id} data-id={it.id}>
                <div className="submission-header">
                  <div className="submission-info"><h3>Reference ID</h3><p className="ref-id">{it.id}</p></div>
                  <div className="submission-info"><h3>Hospital</h3><p>{hospitalName(it.hospitalId)}</p></div>
                  <div className="submission-info"><h3>Category</h3><p>{it.category}</p></div>
                  <div className="submission-info"><h3>Date Submitted</h3><p>{new Date(it.createdAt).toLocaleDateString()}</p></div>
                  <div className="submission-info"><h3>Status</h3><span className={`badge ${BADGES[it.status] || 'badge-open'}`}>{it.status}</span></div>
                </div>
                <div style={{ marginTop: 12, color: '#4A5565', fontSize: 14, lineHeight: 1.6 }}>{it.summary ?? it.description ?? ''}</div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button type="button" className="btn-outline-sm" onClick={() => edit(it)}>Edit</button>
                  <button
                    type="button"
                    className="btn-outline-sm"
                    onClick={() => setConfirm({ title: 'Delete submission', message: 'Delete this submission?', onConfirm: () => remove(it.id) })}
                  >
                    Delete
                  </button>
                  <button type="button" className="btn-primary-sm" onClick={() => resolve(it.id)}>Mark Resolved</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={async () => { const c = confirm; setConfirm(null); await c.onConfirm(); }}
      />
    </main>
  );
}
