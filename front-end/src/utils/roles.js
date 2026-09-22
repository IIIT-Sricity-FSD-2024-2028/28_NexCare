// Everything the app knows about the seven login roles: the canonical role
// string the backend uses, the aliases the HTML portal tolerated, the label a
// sidebar shows, and where a login lands. This replaces the switch statements
// in shared/session.js (redirectByRole) and shared/nav.js (displayRoleName).

export const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  STAFF: 'administrative_staff',
  AMBULANCE: 'ambulance',
  HOSPITAL_MANAGER: 'hospital_manager',
  REGIONAL_MANAGER: 'regional_manager',
  SUPERUSER: 'superuser',
};

const ALIASES = {
  super_user: ROLES.SUPERUSER,
  admin: ROLES.SUPERUSER,
  regional_officer: ROLES.REGIONAL_MANAGER,
  hospital_admin: ROLES.HOSPITAL_MANAGER,
  admin_staff: ROLES.STAFF,
  staff: ROLES.STAFF,
  ambulance_staff: ROLES.AMBULANCE,
};

/** 'regional_officer' → 'regional_manager'; unknown strings pass through untouched. */
export function normalizeRole(role) {
  const r = String(role || '').toLowerCase();
  return ALIASES[r] || r;
}

export const ROLE_LABELS = {
  [ROLES.SUPERUSER]: 'Super User',
  [ROLES.REGIONAL_MANAGER]: 'Regional Officer',
  [ROLES.HOSPITAL_MANAGER]: 'Hospital Manager',
  [ROLES.STAFF]: 'Administrative Staff',
  [ROLES.PATIENT]: 'Patient',
  [ROLES.AMBULANCE]: 'Ambulance Staff',
  [ROLES.DOCTOR]: 'Doctor',
};

export function roleLabel(role) {
  return ROLE_LABELS[normalizeRole(role)] || 'User';
}

/** The URL prefix each portal lives under. */
export const PORTAL_BASE = {
  [ROLES.PATIENT]: '/patient',
  [ROLES.DOCTOR]: '/doctor',
  [ROLES.STAFF]: '/staff',
  [ROLES.AMBULANCE]: '/ambulance',
  [ROLES.HOSPITAL_MANAGER]: '/hospital-manager',
  [ROLES.REGIONAL_MANAGER]: '/regional-officer',
  [ROLES.SUPERUSER]: '/superuser',
};

/** Where a login lands (session.js redirectByRole). */
export const ROLE_HOME = {
  [ROLES.PATIENT]: '/patient/dashboard',
  [ROLES.DOCTOR]: '/doctor/dashboard',
  [ROLES.STAFF]: '/staff/dashboard',
  [ROLES.AMBULANCE]: '/ambulance/dashboard',
  [ROLES.HOSPITAL_MANAGER]: '/hospital-manager/overview',
  [ROLES.REGIONAL_MANAGER]: '/regional-officer/dashboard',
  [ROLES.SUPERUSER]: '/superuser/dashboard',
};

export function homeFor(role) {
  return ROLE_HOME[normalizeRole(role)] || '/';
}

/** The login page for a role: /login/<slug>. */
export const LOGIN_SLUG = {
  [ROLES.PATIENT]: 'patient',
  [ROLES.DOCTOR]: 'doctor',
  [ROLES.STAFF]: 'staff',
  [ROLES.AMBULANCE]: 'staff',
  [ROLES.HOSPITAL_MANAGER]: 'hospital-manager',
  [ROLES.REGIONAL_MANAGER]: 'regional-officer',
  [ROLES.SUPERUSER]: 'superuser',
};

export function loginPathFor(role) {
  const slug = LOGIN_SLUG[normalizeRole(role)];
  return slug ? `/login/${slug}` : '/login';
}
