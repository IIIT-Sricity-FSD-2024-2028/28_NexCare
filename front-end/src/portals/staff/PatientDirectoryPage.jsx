import { useEffect, useRef, useState } from 'react';
import {
  selectPatientDocuments,
  fetchPatientDocuments,
  uploadPatientDocument,
  editPatientDocument,
  downloadPatientDocument,
  deletePatientDocument,
  fetchPatientDirectory,
  selectStaffPatients,
} from '../../store/staffSlice';
import { useNotify } from '../../hooks/useNotify';
import useConfirm from '../../hooks/useConfirm';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

// administrative_staff/patient-directory.html + patient-directory.js: the
// read-only patient table and the per-patient documents modal (uploads go
// through POST /api/uploads as multipart with the field named `file`).

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PatientDirectoryPage() {
  const notify = useNotify();
  const dispatch = useAppDispatch();
  const { list: patients } = useAppSelector(selectStaffPatients);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState('');
  const [docs, setDocs] = useState(null); // { patientId, patientName }

  useEffect(() => {
    dispatch(fetchPatientDirectory()).unwrap()
      .catch(() => notify('Failed to load patients. Please check your connection and try again.', 'error'))
      .finally(() => setLoading(false));
  }, [dispatch, notify]);

  const q = term.toLowerCase().trim();
  const filtered = patients.filter((p) =>
    ((p.name || p.fullName) && (p.name || p.fullName).toLowerCase().includes(q))
    || (p.email && p.email.toLowerCase().includes(q))
    || (p.patientId && String(p.patientId).toLowerCase().includes(q))
    || (p.patientIdDisplay && String(p.patientIdDisplay).toLowerCase().includes(q))
    || (p.id && p.id.toLowerCase().includes(q)));

  return (
    <div className="sp-directory">
      <div className="header-row">
        <div>
          <h1>Patient Directory (Read-Only)</h1>
          <div className="sub">View all patients registered in the NexCare System</div>
        </div>
      </div>

      <div className="filters" style={{ margin: '20px 0' }}>
        <input id="searchInput" className="search form-input" placeholder="Search by name, ID or email..." style={{ width: 300, padding: 10, borderRadius: 6, border: '1px solid #ccc' }} value={term} onChange={(e) => setTerm(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table id="patientsTable">
            <thead>
              <tr>
                <th>Patient ID</th><th>Full Name</th><th>Email</th><th>Contact Phone</th>
                <th>Blood Group</th><th>Age</th><th>Status</th><th>Documents</th>
              </tr>
            </thead>
            <tbody id="patientsTableBody">
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>Loading patients…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#6b7280' }}>No patients found.</td></tr>
              ) : filtered.map((p) => {
                const statusClass = p.status === 'Active' ? 'active' : (p.status === 'Critical' ? 'critical' : '');
                const patientId = p.patientId || p.patientIdDisplay || p.id;
                return (
                  <tr key={p.id}>
                    <td><strong>{patientId}</strong></td>
                    <td>{p.name || p.fullName || '-'}</td>
                    <td>{p.email || '-'}</td>
                    <td>{p.phone || '-'}</td>
                    <td>{p.bloodGroup || '-'}</td>
                    <td>{p.age || '-'}</td>
                    <td><span className={`badge ${statusClass}`}>{p.status || 'Registered'}</span></td>
                    <td>
                      <button type="button" className="btn-outline" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setDocs({ patientId, patientName: p.name || p.fullName || '' })}>
                        Documents
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {docs && <DocumentsModal patientId={docs.patientId} patientName={docs.patientName} onClose={() => setDocs(null)} />}
    </div>
  );
}

function DocumentsModal({ patientId, patientName, onClose }) {
  const { ask, dialog } = useConfirm();
  const fileRef = useRef(null);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [editing, setEditing] = useState(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const dispatch = useAppDispatch();
  const documents = useAppSelector((state) => selectPatientDocuments(state, patientId));
  const list = documents?.list ?? null;
  const listError = documents?.error;
  const [uploading, setUploading] = useState(false);

  useEffect(() => { dispatch(fetchPatientDocuments(patientId)); }, [dispatch, patientId]);

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError('Choose a file to upload first.'); return; }
    setUploading(true);
    setError('');
    setStatus(`Uploading ${file.name}…`);
    try {
      await dispatch(uploadPatientDocument({ file, patientId, description: description.trim() })).unwrap();
      setStatus(`${file.name} uploaded.`);
      fileRef.current.value = '';
      setDescription('');
      await dispatch(fetchPatientDocuments(patientId));
    } catch (err) {
      setStatus('');
      // e.g. "Unsupported file type ..." or "File is too large. Maximum size is 5 MB."
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function saveDescription() {
    try {
      await dispatch(editPatientDocument({ id: editing.id, patientId, description: editing.description })).unwrap();
      setEditing(null);
      setError('');
      setStatus('Description updated.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function download(id, name) {
    try {
      const blob = await dispatch(downloadPatientDocument(id));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!(await ask('Delete this document? This cannot be undone.', { title: 'Delete document', confirmLabel: 'Delete', danger: true }))) return;
    try {
      await dispatch(deletePatientDocument({ id, patientId })).unwrap();
      setStatus('Document deleted.');
      await dispatch(fetchPatientDocuments(patientId));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div id="docsModal" className="modal active" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card modal-card" style={{ maxWidth: 620 }}>
        <h3 id="docsTitle">Documents — {patientName} ({patientId})</h3>
        <div className="small" style={{ color: '#6b7280', marginBottom: 12 }}>
          PDF, JPEG, PNG, WEBP, TXT, CSV, DOC or DOCX — up to 5 MB per file.
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <input type="file" id="docFile" ref={fileRef} className="input" style={{ flex: 1, margin: 0, padding: 8 }} />
        </div>
        <input id="docDescription" className="input" placeholder="Description (e.g. Discharge summary)" value={description} onChange={(e) => setDescription(e.target.value)} />
        {error && <div id="docError" className="small" style={{ color: '#b91c1c', marginTop: 6 }}>{error}</div>}
        {status && <div id="docStatus" className="small" style={{ color: '#2563eb', marginTop: 6 }}>{status}</div>}

        {editing && <div style={{ marginTop: 12 }}>
          <label htmlFor="editDocumentDescription">Edit description</label>
          <input id="editDocumentDescription" className="input" maxLength={500} value={editing.description}
            onChange={(event) => setEditing({ ...editing, description: event.target.value })} />
          <button type="button" className="btn" onClick={saveDescription}>Save description</button>
          <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel edit</button>
        </div>}
        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#374151' }}>Uploaded documents</h4>
          <div id="docList" style={{ maxHeight: 220, overflowY: 'auto' }}>
            {list === null ? (
              <div className="small" style={{ color: '#6b7280' }}>Loading…</div>
            ) : listError ? (
              <div className="small" style={{ color: '#b91c1c' }}>Failed to load documents: {listError}</div>
            ) : list.length === 0 ? (
              <div className="small" style={{ color: '#9ca3af', fontStyle: 'italic' }}>No documents uploaded yet.</div>
            ) : list.map((d) => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.originalName}</div>
                  <div className="small" style={{ color: '#6b7280' }}>
                    {formatSize(d.sizeBytes)} • {new Date(d.uploadedAt).toLocaleString()}{d.description ? ` • ${d.description}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button type="button" className="btn-outline" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => download(d.id, d.originalName)}>Download</button>
                  {d.uploadedBy === userId && <button type="button" className="btn-outline"
                    onClick={() => setEditing({ id: d.id, description: d.description || '' })}>Edit description</button>}
                  <button type="button" className="btn-outline" style={{ padding: '4px 8px', fontSize: 11, color: '#b91c1c' }} onClick={() => remove(d.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn" id="docUploadBtn" onClick={upload} disabled={uploading}>Upload</button>
          <button type="button" className="btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
      {dialog}
    </div>
  );
}
