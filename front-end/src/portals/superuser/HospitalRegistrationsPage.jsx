import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Hospitals, Users } from '../../api';
import { pageLink } from '../../api/links';
import { useToast } from '../../context/ToastContext';
import { MessageRow, SuPage } from './suShared';

// superuser/hospital-registrations.html + hospital-registrations.js: every
// hospital on the platform, pending registrations first; assign a regional
// officer (ranked by the backend's suggestion endpoint), give final approval
// (which mints the hospital manager's login) or reject with a reason.

const cityKey = (city) => String(city || '').trim().toLowerCase();
const covers = (areas, city) => Array.isArray(areas) && areas.some((a) => cityKey(a) === cityKey(city));

/** "Kavitha Menon · Chittoor, Nellore · 2 hospitals (low)" */
function loadLabel(r) {
  const parts = [r.regionalManagerName];
  if (r.areas && r.areas.length) parts.push(r.areas.join(', '));
  if (r.currentWorkload !== null && r.currentWorkload !== undefined) {
    const level = r.workloadLevel ? ` (${r.workloadLevel})` : '';
    parts.push(`${r.currentWorkload} hospital${r.currentWorkload === 1 ? '' : 's'}${level}`);
  } else {
    parts.push(r.regionalManagerEmail);
  }
  return parts.join(' · ');
}

// Sort: pending first (cleared > rejected > pending), then everything else, newest first
function byQueueOrder(a, b) {
  const aP = a.verificationStatus === 'pending_verification';
  const bP = b.verificationStatus === 'pending_verification';
  if (aP && !bP) return -1;
  if (bP && !aP) return 1;
  if (aP && bP) {
    if (a.regionalReviewStatus === 'cleared' && b.regionalReviewStatus !== 'cleared') return -1;
    if (b.regionalReviewStatus === 'cleared' && a.regionalReviewStatus !== 'cleared') return 1;
  }
  const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return tB - tA;
}

function StatusBadge({ status }) {
  if (status === 'pending_verification') return <span className="badge" style={{ background: '#FEF3C7', color: '#D97706' }}>Pending</span>;
  if (status === 'verified') return <span className="badge" style={{ background: '#DCFCE7', color: '#15803D' }}>Verified</span>;
  if (status === 'rejected') return <span className="badge" style={{ background: '#FEE2E2', color: '#DC2626' }}>Rejected</span>;
  return <span className="badge" style={{ background: '#F3F4F6', color: '#374151' }}>{status || 'Unknown'}</span>;
}

const actionBtn = { width: 100, textAlign: 'center', padding: '4px 8px', fontSize: 12, cursor: 'pointer', borderRadius: 4 };
const modalBackdrop = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(4px)' };
const grey = { padding: '9px 16px', borderRadius: 8, background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: 13, cursor: 'pointer' };

export default function HospitalRegistrationsPage() {
  const { notify } = useToast();
  const [hospitals, setHospitals] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [error, setError] = useState('');
  const [term, setTerm] = useState('');
  const [tick, setTick] = useState(0); // bumps when the suggestion cache fills
  const [creds, setCreds] = useState(null); // { email, password, hospitalName }
  const [copied, setCopied] = useState(false);
  const [reject, setReject] = useState(null); // { id, name, reason, error, busy }
  // One request per distinct city, cached for the page. The backend ranks by
  // area coverage first, then by current workload, so the dropdown order IS
  // the recommendation — the page does no ranking of its own.
  const suggestions = useRef(new Map());

  const loadHospitals = useCallback(async () => {
    setError('');
    try {
      const hRes = await Hospitals.getAll();
      const list = (hRes.data || []).slice().sort(byQueueOrder);
      // Fetch Regional Officers for dropdown.
      let ros = [];
      try {
        const uRes = await Users.getAll();
        ros = (uRes.data || []).filter((u) => u.role === 'regional_manager');
      } catch { /* the dropdown falls back to nothing */ }
      const cities = [...new Set(list.map((h) => String(h.city || '').trim()).filter(Boolean))]
        .filter((city) => !suggestions.current.has(cityKey(city)));
      await Promise.all(cities.map(async (city) => {
        try {
          const res = await Users.suggestRegionalManagers(city);
          if (Array.isArray(res.data)) suggestions.current.set(cityKey(city), res.data);
        } catch (err) {
          // A failed suggestion must not stop the table rendering; the
          // dropdown falls back to the plain officer list below.
          console.warn(`Could not load RM suggestions for ${city}:`, err.message);
        }
      }));
      setOfficers(ros);
      setHospitals(list);
      setTick((t) => t + 1);
    } catch (err) {
      setError(`Error loading data. ${err.message}`);
      setHospitals([]);
    }
  }, []);

  useEffect(() => { loadHospitals(); }, [loadHospitals]);

  const rows = useMemo(() => {
    const t = term.toLowerCase().trim();
    if (!t) return hospitals || [];
    return (hospitals || []).filter((h) =>
      (h.name && h.name.toLowerCase().includes(t))
      || (h.city && h.city.toLowerCase().includes(t))
      || (h.registrationNumber && h.registrationNumber.toLowerCase().includes(t))
      || (h.adminName && h.adminName.toLowerCase().includes(t)));
  }, [hospitals, term]);

  /**
   * Ranked officers for a city. Falls back to the raw officer list — with
   * coverage worked out client-side — if the suggestion call did not land, so
   * the Admin is never left with an empty dropdown.
   */
  function suggestionsFor(city) {
    const cached = suggestions.current.get(cityKey(city));
    if (cached) return cached.map((r) => ({ ...r, coversCity: covers(r.areas, city) }));
    return officers.map((ro) => ({
      regionalManagerId: ro.id, regionalManagerName: ro.name, regionalManagerEmail: ro.email,
      areas: ro.areas || [], currentWorkload: null, workloadLevel: null, reason: '', coversCity: covers(ro.areas, city),
    })).sort((a, b) => (b.coversCity === true) - (a.coversCity === true));
  }

  async function assignRegionalOfficer(hospitalId, managerId) {
    if (!managerId) return;
    try {
      await Hospitals.assignManager(hospitalId, managerId);
      notify('Regional Officer assigned successfully!', 'success');
      loadHospitals();
    } catch (err) {
      notify(err?.message || 'Could not assign officer', 'error');
    }
  }

  async function verifyHospital(h) {
    try {
      const res = await Hospitals.approve(h.id);
      if (res.data && res.data.email && res.data.password) {
        setCopied(false);
        setCreds({ email: res.data.email, password: res.data.password, hospitalName: res.data.hospitalName || h.name || 'Registered Hospital' });
      } else {
        notify('Hospital Approved Successfully!', 'success');
        loadHospitals();
      }
    } catch (err) {
      notify(err?.message || 'Failed to approve hospital', 'error');
    }
  }

  async function confirmReject() {
    const reason = reject.reason.trim();
    if (!reason || reason.length < 5) {
      setReject((r) => ({ ...r, error: true }));
      return;
    }
    setReject((r) => ({ ...r, busy: true }));
    try {
      await Hospitals.rejectFinal(reject.id, reason);
      setReject(null);
      notify('Hospital registration rejected and reason logged.', 'info');
      loadHospitals();
    } catch (err) {
      setReject(null);
      notify(err?.message || 'Failed to reject hospital', 'error');
    }
  }

  function copyCredentials() {
    const portalUrl = `${window.location.origin}${pageLink('hospital_manager/dashboard')}`;
    const text = `NEXCARE HOSPITAL MANAGER CREDENTIALS\nHospital: ${creds.hospitalName}\nPortal URL: ${portalUrl}\nLogin Email: ${creds.email}\nInitial Password: ${creds.password}\n\nPlease change your password upon first login.`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function actionsFor(h) {
    if (h.verificationStatus === 'pending_verification') {
      if (h.regionalReviewStatus === 'cleared') {
        return (
          <>
            <div style={{ fontSize: 10, color: '#15803D', marginBottom: 4, fontWeight: 600 }}>RO Cleared</div>
            <button type="button" className="btn-approve" style={actionBtn} onClick={() => verifyHospital(h)} title="Final approve">Final Approve</button>
            <button type="button" className="btn-reject" style={{ ...actionBtn, marginTop: 4 }} onClick={() => setReject({ id: h.id, name: h.name, reason: '' })} title="Reject">Reject</button>
          </>
        );
      }
      if (h.regionalReviewStatus === 'rejected') {
        return (
          <>
            <div style={{ fontSize: 10, color: '#DC2626', marginBottom: 4, fontWeight: 600 }}>
              RO Rejected<br /><span style={{ fontWeight: 'normal', color: '#6A7282' }}>{h.regionalReviewNotes ? `(Reason: ${h.regionalReviewNotes})` : ''}</span>
            </div>
            <button type="button" className="btn-reject" style={actionBtn} onClick={() => setReject({ id: h.id, name: h.name, reason: '' })} title="Reject">Final Reject</button>
          </>
        );
      }
      return (
        <>
          <div style={{ fontSize: 10, color: '#6A7282', marginBottom: 4, fontWeight: 600 }}>{h.assignedManagerId ? 'RO pending' : 'RO not assigned'}</div>
          <button type="button" className="btn-approve" style={actionBtn} onClick={() => verifyHospital(h)} title="Direct approve">Direct Approve</button>
          <button type="button" className="btn-reject" style={{ ...actionBtn, marginTop: 4 }} onClick={() => setReject({ id: h.id, name: h.name, reason: '' })} title="Reject">Reject</button>
        </>
      );
    }
    if (h.verificationStatus === 'verified') return <span style={{ fontSize: 12, color: '#15803D', fontWeight: 600 }}>Approved</span>;
    if (h.verificationStatus === 'rejected') return <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>Rejected</span>;
    return null;
  }

  const cell = { padding: '16px 24px', fontSize: 14, color: '#475569' };

  return (
    <SuPage className="su-page su-regs" title="System Administrator Portal">
      <div className="page-header">
        <div>
          <h1>Hospital Registrations</h1>
          <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Review pending hospital registrations and assign Regional Officers.</p>
        </div>
        <div className="action-row">
          <input type="text" id="searchInput" placeholder="Search Hospitals..." className="form-control" style={{ width: 250 }} value={term} onChange={(e) => setTerm(e.target.value)} />
        </div>
      </div>

      <div className="table-card">
        <table className="data-table" id="hospitalsTable">
          <thead>
            <tr>
              <th>Hospital Name</th><th>Registration Number</th><th>Admin Contact</th><th>Verification Status</th><th>Regional Officer</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="tableBody" data-tick={tick}>
            {error ? (
              <MessageRow colSpan={6} padding={24} color="#DC2626">{error}</MessageRow>
            ) : hospitals === null ? (
              <MessageRow colSpan={6} padding={24} color="#6A7282">Loading hospitals...</MessageRow>
            ) : !rows.length ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#6A7282' }}>
                  <svg style={{ marginBottom: 12, opacity: 0.5 }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                  <br />No hospitals found in the system.
                </td>
              </tr>
            ) : rows.map((h) => {
              const ranked = suggestionsFor(h.city);
              const covering = ranked.filter((r) => r.coversCity);
              const others = ranked.filter((r) => !r.coversCity);
              const top = ranked[0];
              const pending = h.verificationStatus === 'pending_verification';
              const option = (r) => <option key={r.regionalManagerId} value={r.regionalManagerId}>{loadLabel(r)}</option>;
              return (
                <tr key={h.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ ...cell, color: '#111827', fontWeight: 500 }}>
                    {h.name} <br /> <span style={{ fontSize: 12, color: '#6A7282', fontWeight: 'normal' }}>{h.city}</span>
                  </td>
                  <td style={cell}>{h.registrationNumber || 'N/A'}</td>
                  <td style={cell}>{h.adminName}<br /><span style={{ fontSize: 12 }}>{h.adminEmail}</span></td>
                  <td style={{ padding: '16px 24px' }}><StatusBadge status={h.verificationStatus} /></td>
                  <td style={{ padding: '16px 24px' }}>
                    <select
                      className="form-control"
                      style={{ padding: 4, fontSize: 12, maxWidth: 150, textOverflow: 'ellipsis' }}
                      value={h.assignedManagerId || ''}
                      disabled={!pending}
                      onChange={(e) => assignRegionalOfficer(h.id, e.target.value)}
                    >
                      <option value="">{ranked.length ? '-- Assign regional officer --' : '-- No regional officers configured --'}</option>
                      {covering.length > 0 && <optgroup label={`Covers ${h.city || 'this area'}`}>{covering.map(option)}</optgroup>}
                      {others.length > 0 && <optgroup label="Other areas">{others.map(option)}</optgroup>}
                    </select>
                    {top && pending && !h.assignedManagerId && (
                      <div style={{ fontSize: 11, color: '#6A7282', marginTop: 4 }}>
                        Suggested: <strong>{top.regionalManagerName}</strong> — {top.reason || ''}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>{actionsFor(h)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Credentials modal after a final approval */}
      {creds && (
        <div id="credentialsModal" style={modalBackdrop}>
          <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 520, padding: 28, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✓</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Hospital Approved Successfully</h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>Manager credentials generated for {creds.hospitalName}</p>
              </div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, margin: '18px 0', fontSize: 13.5 }}>
              {[
                ['Role:', <span style={{ fontWeight: 600, color: '#0F172A' }}>Hospital Manager</span>],
                ['Login Email:', <span id="credEmail" style={{ fontWeight: 700, color: '#1E293B', fontFamily: 'monospace' }}>{creds.email}</span>],
                ['Initial Password:', <span id="credPassword" style={{ fontWeight: 700, color: '#2563EB', fontFamily: 'monospace' }}>{creds.password}</span>],
                ['Portal Link:', <span style={{ fontWeight: 600, color: '#059669', fontSize: 12 }}>{pageLink('hospital_manager/dashboard')}</span>],
              ].map(([k, v], i, arr) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', ...(i < arr.length - 1 ? { marginBottom: 10, paddingBottom: 8, borderBottom: '1px dashed #CBD5E1' } : {}) }}>
                  <span style={{ color: '#64748B' }}>{k}</span>{v}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 20px' }}>Please copy and securely transmit these credentials to the hospital administrator.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" id="copyCredsBtn" onClick={copyCredentials} style={{ padding: '10px 18px', borderRadius: 8, background: '#2563EB', color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {copied ? '✓ Copied to Clipboard!' : '📋 Copy Credentials'}
              </button>
              <button type="button" id="closeCredsBtn" onClick={() => { setCreds(null); loadHospitals(); }} style={{ ...grey, padding: '10px 18px' }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection reason modal */}
      {reject && (
        <div id="rejectHospitalModal" style={modalBackdrop}>
          <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 480, padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✕</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0F172A' }}>Reject Hospital Registration</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B' }}>{reject.name || 'Selected Hospital'}</p>
              </div>
            </div>
            <div style={{ margin: '16px 0' }}>
              <label htmlFor="rejectionReasonInput" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Reason for Rejection <span style={{ color: '#DC2626' }}>*</span></label>
              <textarea
                id="rejectionReasonInput"
                rows={3}
                autoFocus
                placeholder="e.g. Incomplete NABH accreditation or invalid medical council registration license"
                value={reject.reason}
                onChange={(e) => setReject((r) => ({ ...r, reason: e.target.value }))}
                style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: 10, fontSize: 13, resize: 'none', fontFamily: 'inherit' }}
              />
              <div id="rejectErrorMsg" style={{ display: reject.error ? 'block' : 'none', color: '#DC2626', fontSize: 12, marginTop: 4 }}>Please provide a specific rejection reason.</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" id="cancelRejectBtn" onClick={() => setReject(null)} style={grey}>Cancel</button>
              <button type="button" id="confirmRejectBtn" onClick={confirmReject} disabled={reject.busy} style={{ padding: '9px 16px', borderRadius: 8, background: '#DC2626', color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                {reject.busy ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuPage>
  );
}
