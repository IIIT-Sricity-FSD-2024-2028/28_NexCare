import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { homeFor } from '../../utils/roles';
import { BackIcon } from '../icons';

// session.js injectBackButton(): a small back control on every portal page
// except a dashboard/home. Goes back in history when there is any, otherwise
// to the role's home. The HTML pinned it to the viewport and it overlapped the
// logo; here it sits inline in the header before the title.
const HIDDEN_ON = /(login|signup|register|landing|dashboard|overview)/i;

export default function BackButton() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (HIDDEN_ON.test(pathname)) return null;

  function goBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate(role ? homeFor(role) : '/');
  }

  return (
    <button type="button" className="nc-back-btn" aria-label="Back" onClick={goBack}>
      <BackIcon />
    </button>
  );
}
