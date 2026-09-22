import { useEffect, useState } from 'react';
import { loadCatalogue } from './catalogue';

// One load per mount (doctor-directory.js hydrated once per page load).
// `catalogue` is [] until it resolves; `error` is set when the API is down.
export default function useDoctorDirectory() {
  const [state, setState] = useState({ catalogue: [], loading: true, error: '' });

  useEffect(() => {
    let cancelled = false;
    loadCatalogue()
      .then((catalogue) => { if (!cancelled) setState({ catalogue, loading: false, error: '' }); })
      .catch((err) => {
        console.error('[NexCare] Live doctor directory could not be loaded:', err.message);
        if (!cancelled) setState({ catalogue: [], loading: false, error: err.message || 'Could not load the hospital directory' });
      });
    return () => { cancelled = true; };
  }, []);

  return state;
}
