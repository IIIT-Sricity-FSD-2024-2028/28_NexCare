// In-app links, and the bridge from the HTML portal's page names to SPA routes.
//
// The HTML portal built links with window.pageLink('hospital-details', { id })
// because the static host dropped query strings from *.html URLs. The SPA has
// no such problem, so pageLink() is a pure function: it maps the legacy page
// name to its route and appends the query. A page that has not been ported yet
// still gets a valid route — it renders the "coming in phase N" placeholder
// until its phase lands — so links can be written once and never revisited.

import { q } from './client';

// Legacy path (folder/page, no .html, hash sections as folder/page#section) → SPA path.
// Kept flat and explicit on purpose: grep-able, and one line per page in plan.md §2.
export const LEGACY_ROUTES = {
  // public + auth
  'landing/landing': '/',
  'landing/hospital-registration': '/hospital-registration',
  'hospital-registration/register': '/hospital-registration',
  'auth/login': '/login',
  'auth/patient-login': '/login/patient',
  'auth/doctor-login': '/login/doctor',
  'auth/staff-login': '/login/staff',
  'auth/hospital-manager-login': '/login/hospital-manager',
  'auth/regional-officer-login': '/login/regional-officer',
  'auth/superuser-login': '/login/superuser',
  'auth/patient-register': '/register/patient',
  'auth/staff-register': '/register/staff',
  'auth/signup': '/signup',
  'auth/forgot-password': '/forgot-password',
  'auth/change-password': '/change-password',
  // patient
  'patient/dashboard': '/patient/dashboard',
  'patient/hospital-search': '/patient/hospital-search',
  'patient/appointments/appointments': '/patient/appointments',
  'patient/billing': '/patient/billing',
  'patient/ambulance': '/patient/ambulance',
  'patient/feedback': '/patient/feedback',
  'patient/membership': '/patient/membership',
  'patient/profile': '/patient/profile',
  // doctor
  'doctor/dashboard': '/doctor/dashboard',
  'doctor/appointments': '/doctor/appointments',
  'doctor/earnings': '/doctor/earnings',
  'doctor/leaves': '/doctor/leaves',
  'doctor/profile': '/doctor/profile',
  // administrative staff
  'administrative_staff/dashboard': '/staff/dashboard',
  'administrative_staff/manage_appointments': '/staff/manage-appointments',
  'administrative_staff/patient_checkin': '/staff/patient-checkin',
  'administrative_staff/patient-directory': '/staff/patient-directory',
  'administrative_staff/bed-allocation': '/staff/bed-allocation',
  'administrative_staff/generate-bill': '/staff/generate-bill',
  'administrative_staff/inventory': '/staff/inventory',
  'administrative_staff/staff_scheduling': '/staff/staff-scheduling',
  'administrative_staff/leave-requests': '/staff/leave-requests',
  'administrative_staff/feedback': '/staff/feedback',
  'administrative_staff/system-logs': '/staff/system-logs',
  // hospital manager (one HTML page, hash sections)
  'hospital_manager/dashboard': '/hospital-manager/overview',
  'hospital_manager/dashboard#overview': '/hospital-manager/overview',
  'hospital_manager/dashboard#staff': '/hospital-manager/staff',
  'hospital_manager/dashboard#leaves': '/hospital-manager/leaves',
  'hospital_manager/dashboard#schedules': '/hospital-manager/schedules',
  'hospital_manager/dashboard#supervision': '/hospital-manager/supervision',
  'hospital_manager/dashboard#support': '/hospital-manager/support',
  'hospital_manager/dashboard#feedback': '/hospital-manager/feedback',
  'hospital_manager/dashboard#inventory-approvals': '/hospital-manager/inventory-approvals',
  'hospital_manager/dashboard#ambulance': '/hospital-manager/ambulance',
  'hospital_manager/dashboard#revenue': '/hospital-manager/revenue',
  'hospital_manager/dashboard#subscription': '/hospital-manager/subscription',
  'hospital_manager/dashboard#setup': '/hospital-manager/setup',
  // ambulance (one HTML page, data-page sections)
  'ambulance/index': '/ambulance/dashboard',
  'ambulance/index#dashboard': '/ambulance/dashboard',
  'ambulance/index#ambulance-requests': '/ambulance/ambulance-requests',
  'ambulance/index#assigned-dispatch': '/ambulance/assigned-dispatch',
  'ambulance/index#active-transport': '/ambulance/active-transport',
  'ambulance/index#completed-transports': '/ambulance/completed-transports',
  'ambulance/index#profile': '/ambulance/profile',
  // regional officer
  'regional-officer/dashboard': '/regional-officer/dashboard',
  'regional-officer/hospital-approvals': '/regional-officer/hospital-approvals',
  'regional-officer/hospital-details': '/regional-officer/hospital-details',
  'regional-officer/hospital-comparison': '/regional-officer/hospital-comparison',
  'regional-officer/performance-alerts': '/regional-officer/performance-alerts',
  'regional-officer/complaints': '/regional-officer/complaints',
  'regional-officer/revenue': '/regional-officer/revenue',
  'regional-officer/hierarchy': '/regional-officer/hierarchy',
  'regional-officer/profile': '/regional-officer/profile',
  // superuser
  'superuser/dashboard': '/superuser/dashboard',
  'superuser/hierarchy': '/superuser/hierarchy',
  'superuser/hospital-registrations': '/superuser/hospital-registrations',
  'superuser/patient-directory': '/superuser/patient-directory',
  'superuser/manage-users': '/superuser/manage-users',
  'superuser/system-settings': '/superuser/system-settings',
  'superuser/feedback': '/superuser/feedback',
  'superuser/revenue': '/superuser/revenue',
  'superuser/reports': '/superuser/reports',
};

/** 'regional-officer/hospital-details.html' or '../superuser/revenue' → the table key. */
function legacyKey(page) {
  return String(page || '')
    .replace(/^(\.\.\/|\.\/|\/)+/, '')
    .replace(/\.html(?=$|#)/i, '');
}

/**
 * pageLink('regional-officer/hospital-details', { id: 'H001' })
 *   → '/regional-officer/hospital-details?id=H001'
 *
 * Accepts a legacy page name (with or without .html / leading ../) or an SPA
 * path that already starts with '/'. Unknown legacy names fall through to
 * '/<name>' so the mistake is visible in the address bar rather than silent.
 */
export function pageLink(page, params = {}) {
  const target = String(page || '').startsWith('/') && !/\.html/i.test(page)
    ? page
    : LEGACY_ROUTES[legacyKey(page)] || `/${legacyKey(page)}`;
  return `${target}${q(params)}`;
}
