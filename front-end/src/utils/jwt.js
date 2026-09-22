// Client-side JWT payload reading (shared/session.js parseJWTPayload). The
// signature is the backend's job; here we only need the claims and the expiry.

export function parseJwtPayload(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return null;
    const raw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(raw).split('').map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`).join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** True when the token carries an `exp` that is already in the past. */
export function isExpired(payload) {
  const now = Math.floor(Date.now() / 1000);
  return Boolean(payload && payload.exp && now > payload.exp);
}
