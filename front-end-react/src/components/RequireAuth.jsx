import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeFor, normalizeRole } from '../utils/roles';

/**
 * Route guard (session.js checkAuth + checkRoleAccess).
 *   - no session          → /login, remembering where the visit was going
 *   - wrong role          → that role's own home (the HTML portal bounced to
 *                           login after wiping the session; keeping the session
 *                           and sending the user to their own portal is the
 *                           same outcome without the surprise logout)
 */
export default function RequireAuth({ roles, children }) {
  const { user, role } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && roles.length && !roles.map(normalizeRole).includes(role)) {
    return <Navigate to={homeFor(role)} replace />;
  }
  return children;
}
