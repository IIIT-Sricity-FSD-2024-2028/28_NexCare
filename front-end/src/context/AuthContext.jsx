// The signed-in user, for any role, shared with every page through useAuth().
//
// A port of front-end/shared/session.js. The HTML portal re-read sessionStorage
// on every page load; here it is read once, kept in React state, and written
// back under the SAME keys so a session is interchangeable with the HTML portal:
//
//   nexcare_auth_token   JWT (sessionStorage AND localStorage, as api.js did)
//   nexcare_csrf_token   last x-csrf-token the server handed out
//   nexcare_user_data    the /auth/login user object, plus anything a portal merges in
//   nexcare_current_role canonical role string
//   nexcare_user_email   the email typed at login
//   isLoggedIn           'true' (legacy flag some pages checked)
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Auth } from '../api';
import { clearAuthToken, getAuthToken, UNAUTHORIZED_EVENT } from '../api/client';
import { isExpired, parseJwtPayload } from '../utils/jwt';
import { normalizeRole } from '../utils/roles';

const USER_KEY = 'nexcare_user_data';
const ROLE_KEY = 'nexcare_current_role';
const EMAIL_KEY = 'nexcare_user_email';

// localStorage keys the HTML logout removed besides the token — demo residue
// from the old NexCareDB bridge; cleared so a next login starts clean.
const LEGACY_LOCAL_KEYS = ['nexcare_patients', 'nexcare_db_v3'];

const AuthContext = createContext(null);

function wipeSession() {
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
  clearAuthToken();
  LEGACY_LOCAL_KEYS.forEach((k) => localStorage.removeItem(k));
}

/** session.js getValidSession(): the token's claims, or null (and a wiped session) when it has expired. */
function validPayload() {
  const token = getAuthToken();
  if (!token) return null;
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  if (isExpired(payload)) {
    wipeSession();
    return null;
  }
  return payload;
}

/** portal.js currentUser(): the cached login user, else the JWT claims shaped like one. */
function readStoredUser() {
  const payload = validPayload();
  if (!payload) return null;
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    if (raw) {
      const u = JSON.parse(raw);
      if (u && u.id) return { ...u, role: normalizeRole(u.role || payload.role) };
    }
  } catch {
    /* fall through to the token */
  }
  // The JWT calls the user id `sub`; the rest of the app calls it `id`.
  return {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    role: normalizeRole(payload.role),
    patientId: payload.patientId,
    hospitalId: payload.hospitalId,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  /** Sign in as `role`; the backend refuses an account whose role does not match. */
  const login = useCallback(async (email, password, role) => {
    const res = await Auth.login(email, password, role);
    const u = res.data?.user;
    if (!u) throw new Error('Login succeeded but no user was returned');
    const canonical = normalizeRole(u.role || role);
    const stored = { ...u, role: canonical };
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem(ROLE_KEY, canonical);
    sessionStorage.setItem(EMAIL_KEY, email);
    sessionStorage.setItem(USER_KEY, JSON.stringify(stored));
    setUser(stored);
    return stored;
  }, []);

  /** Local sign-out only — used when the backend has already rejected the token. */
  const clearSession = useCallback(() => {
    setUser(null);
    wipeSession();
  }, []);

  const logout = useCallback(async () => {
    try {
      await Auth.logout(user?.id);
    } catch {
      /* backend logout is best-effort; the local session goes regardless */
    }
    clearSession();
  }, [user, clearSession]);

  /** Merge fresh fields (e.g. an updated consultation fee, a directory record) into the cached user. */
  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      sessionStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // A 401 from any request means the token is no longer good — drop the session
  // so RequireAuth sends the user back to the login page.
  useEffect(() => {
    const onUnauthorized = () => clearSession();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, role: user?.role || null, login, logout, clearSession, updateUser }),
    [user, login, logout, clearSession, updateUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
