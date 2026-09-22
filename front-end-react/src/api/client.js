// Thin fetch wrapper — the React-module port of front-end/shared/api.js.
//
// Same rules as the original:
//   - backend is always <current hostname>:3001, so the app works from any host
//     (override with VITE_API_URL when the backend lives somewhere else)
//   - the JWT goes in Authorization: Bearer, read from sessionStorage/localStorage
//   - the CSRF token the server hands back in `x-csrf-token` is echoed on writes,
//     and a write rejected for a missing token is primed and retried once
//   - a `{ success: false }` body is an error even on a 2xx status
//
// One deliberate difference: the HTML layer returned { success, data, message }
// and never threw, so every caller checked `res.success`. Here a failure THROWS
// an ApiError (with `.status` and `.data`), and a success resolves to the same
// { success: true, data, message } shape — so `res.data` reads identically and
// the page does not need an `if (!res.success)` branch.

const TOKEN_KEY = 'nexcare_auth_token';
const CSRF_KEY = 'nexcare_csrf_token';

const hostname =
  (window.location.protocol === 'http:' || window.location.protocol === 'https:') &&
  window.location.hostname
    ? window.location.hostname
    : 'localhost';

export const BASE_URL = (import.meta.env.VITE_API_URL || `http://${hostname}:3001/api`).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data ?? null;
  }
}

/** Fired on window when the backend answers 401 — AuthContext logs out on it. */
export const UNAUTHORIZED_EVENT = 'nexcare:unauthorized';

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

let memoryCsrf = null;

function getCsrfToken() {
  try {
    return sessionStorage.getItem(CSRF_KEY) || memoryCsrf;
  } catch {
    return memoryCsrf;
  }
}

function captureCsrfToken(response) {
  try {
    const token = response.headers && response.headers.get('x-csrf-token');
    if (!token) return;
    memoryCsrf = token;
    sessionStorage.setItem(CSRF_KEY, token);
  } catch {
    /* private-mode storage failures must never break the request */
  }
}

/** A safe GET whose only purpose is to be handed a CSRF token. */
async function primeCsrfToken() {
  try {
    const res = await fetch(`${BASE_URL}/hospitals`, { method: 'GET', headers: { Accept: 'application/json' } });
    captureCsrfToken(res);
  } catch {
    /* offline; the caller's own error handling takes over */
  }
}

function headers({ json = true } = {}) {
  const h = { Accept: 'application/json' };
  if (json) h['Content-Type'] = 'application/json';
  const token = getAuthToken();
  if (token) h.Authorization = `Bearer ${token}`;
  const csrf = getCsrfToken();
  if (csrf) h['x-csrf-token'] = csrf;
  return h;
}

async function parse(response, { authed } = {}) {
  captureCsrfToken(response);
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  // A 401 on a request that carried a token means the session is gone; a 401
  // on an anonymous call (a failed login) is just that call's error.
  if (response.status === 401 && authed) {
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
  }

  if (body && typeof body.success === 'boolean' && !body.success) {
    throw new ApiError(body.message || 'API Error', response.status, body.data);
  }
  if (!response.ok) {
    throw new ApiError((body && body.message) || `HTTP Error: ${response.status}`, response.status, body);
  }
  return {
    success: true,
    data: body && body.data !== undefined ? body.data : body,
    message: (body && body.message) || 'Success',
  };
}

function networkError() {
  return new ApiError(`Cannot reach the backend at ${BASE_URL}. Is it running?`, 0);
}

async function send(method, endpoint, buildOptions) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, buildOptions());
  } catch {
    throw networkError();
  }
  if (method === 'GET' || response.status !== 403) return response;

  // A write that arrives before any GET has no CSRF token yet — prime one and retry once.
  // Peek without consuming the body the caller still needs.
  let message = '';
  try {
    message = String((await response.clone().json()).message || '');
  } catch {
    return response;
  }
  if (!/csrf/i.test(message)) return response;

  captureCsrfToken(response);
  await primeCsrfToken();
  try {
    return await fetch(`${BASE_URL}${endpoint}`, buildOptions());
  } catch {
    throw networkError();
  }
}

async function request(method, endpoint, body) {
  const authed = Boolean(getAuthToken());
  const response = await send(method, endpoint, () => {
    const options = { method, headers: headers() };
    if (body !== undefined) options.body = JSON.stringify(body);
    return options;
  });
  return parse(response, { authed });
}

/** Multipart write — `fields` is a plain object; File/Blob values become file parts. */
async function upload(method, endpoint, fields) {
  const authed = Boolean(getAuthToken());
  const response = await send(method, endpoint, () => {
    const form = new FormData();
    Object.entries(fields || {}).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) v.forEach((item) => form.append(k, item));
      else form.append(k, v);
    });
    return { method, headers: headers({ json: false }), body: form };
  });
  return parse(response, { authed });
}

export const http = {
  get: (endpoint) => request('GET', endpoint),
  post: (endpoint, body = {}) => request('POST', endpoint, body),
  put: (endpoint, body = {}) => request('PUT', endpoint, body),
  patch: (endpoint, body = {}) => request('PATCH', endpoint, body),
  delete: (endpoint) => request('DELETE', endpoint),
  upload: (endpoint, fields, method = 'POST') => upload(method, endpoint, fields),
};

/** `{a: 1, b: ''}` → `?a=1` — empty, null and undefined values are dropped. */
export function q(params) {
  const s = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') s.append(k, v);
  });
  const str = s.toString();
  return str ? `?${str}` : '';
}
