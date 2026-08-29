import { HOSPITALS } from './data/hospitals.js';

const BASE_URL = '/api';
const TOKEN_KEY = 'nexcare_auth_token';

export function getAuthToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function getSessionUser() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const raw = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(decodeURIComponent(
      atob(raw).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    ));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      patientId: payload.patientId || null,
    };
  } catch {
    return null;
  }
}

function headers() {
  const h = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const token = getAuthToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function request(method, endpoint, body) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: headers(),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const json = await res.json();

    if (json && typeof json.success === 'boolean' && !json.success) {
      return { success: false, data: null, message: json.message || 'Request failed' };
    }
    if (!res.ok) {
      return { success: false, data: null, message: json.message || `HTTP ${res.status}` };
    }
    return {
      success: true,
      data: json.data !== undefined ? json.data : json,
      message: json.message || 'Success',
    };
  } catch (error) {
    return { success: false, data: null, message: error.message || 'Network error', offline: true };
  }
}

const get = (endpoint) => request('GET', endpoint);
const post = (endpoint, body) => request('POST', endpoint, body);
const patch = (endpoint, body) => request('PATCH', endpoint, body);

export const AuthAPI = {
  async login(email, password) {
    const res = await post('/auth/login', { email, password, role: 'patient' });
    if (res.success && res.data?.token) {
      try {
        sessionStorage.setItem(TOKEN_KEY, res.data.token);
        localStorage.setItem(TOKEN_KEY, res.data.token);
      } catch {  }
    }
    return res;
  },

  logout() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch {  }
  },
};

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_POOL = ['09:00 AM', '10:30 AM', '12:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'];

function hashOf(value) {
  let h = 0;
  for (const ch of String(value)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function scheduleFor(doctor) {
  const h = hashOf(doctor.id || doctor.name);
  const days = [WEEKDAYS[h % 6], WEEKDAYS[(h + 2) % 6], WEEKDAYS[(h + 4) % 6]];
  const availableDays = [...new Set(days)];
  const slots = {};
  availableDays.forEach((day, i) => {
    const offset = (h + i) % 3;
    slots[day] = SLOT_POOL.slice(offset, offset + 4);
  });
  return { availableDays, slots };
}

export const HospitalsAPI = {
  async list() {
    const [hospitalsRes, doctorsRes] = await Promise.all([
      get('/hospitals'),
      get('/users/doctors'),
    ]);

    if (!hospitalsRes.success || !doctorsRes.success || !Array.isArray(doctorsRes.data)) {
      return {
        source: 'offline',
        hospitals: HOSPITALS,
        message: doctorsRes.message || hospitalsRes.message,
      };
    }

    const byHospital = new Map();
    for (const doc of doctorsRes.data) {
      if (!doc.hospitalId || !doc.dept) continue;
      if (!byHospital.has(doc.hospitalId)) byHospital.set(doc.hospitalId, new Map());
      const depts = byHospital.get(doc.hospitalId);
      if (!depts.has(doc.dept)) depts.set(doc.dept, []);
      depts.get(doc.dept).push({
        id: doc.id,
        name: doc.name,
        qualification: `${doc.dept} Consultant`,
        experience: 5 + (hashOf(doc.id) % 20),
        ...scheduleFor(doc),
      });
    }

    const hospitals = hospitalsRes.data
      .filter((h) => !h.verificationStatus || h.verificationStatus === 'verified')
      .map((h) => {
        const depts = byHospital.get(h.id);
        return {
          id: h.id,
          name: h.name,
          city: h.city,
          address: h.address,
          specialities: h.specialities || [],
          departments: depts
            ? [...depts.entries()].map(([name, doctors]) => ({
                id: `${h.id}-${name.toLowerCase().replace(/\s+/g, '-')}`,
                name,
                doctors,
                fee: 400 + (hashOf(name) % 5) * 100,
              }))
            : [],
        };
      })
      .filter((h) => h.departments.length > 0);

    if (hospitals.length === 0) {
      return {
        source: 'offline',
        hospitals: HOSPITALS,
        message: 'No live hospital had any doctors on file',
      };
    }
    return { source: 'live', hospitals, message: hospitalsRes.message };
  },
};

export const AppointmentsAPI = {
  async list(patientId) {
    const query = patientId ? `?patientId=${encodeURIComponent(patientId)}` : '';
    return get(`/appointments${query}`);
  },

  async create(appointment) {
    return post('/appointments', appointment);
  },

  async cancel(id) {
    return patch(`/appointments/${id}/cancel`);
  },
};

export async function getBookedSlots(doctorName, dateLabel) {
  if (!doctorName || !dateLabel) return new Set();
  const res = await AppointmentsAPI.list();
  if (!res.success || !Array.isArray(res.data)) return new Set();

  const norm = (v) => String(v || '').toLowerCase().replace(/^dr\.?\s*/i, '').trim();
  const target = norm(doctorName);

  return new Set(
    res.data
      .filter(
        (a) =>
          a.status !== 'Cancelled' &&
          norm(a.doctor) === target &&
          String(a.dateLabel).trim() === String(dateLabel).trim()
      )
      .map((a) => a.timeLabel)
      .filter(Boolean)
  );
}
