// One sidebar menu per role — the data behind front-end/shared/nav.js, plus
// the sidebars that patient, staff, hospital-manager and ambulance pages carried
// inline in their own HTML. Labels and order match the HTML page each portal's
// users actually saw; the icons for nav.js roles are the originals, the others
// are the closest shape from the same set (Phases 2–5 swap in each portal's own
// sidebar styling and may adjust them).
import { ROLES } from '../../utils/roles';
import {
  GridIcon, HierarchyIcon, HomeIcon, HomeCheckIcon, UsersIcon, ManageUsersIcon, UserCheckIcon,
  SettingsIcon, ChatIcon, RupeeIcon, PieIcon, LeaveIcon, CalendarIcon, BoxIcon, CardIcon,
  AlertIcon, BarsIcon, UserIcon, BedIcon, SearchIcon, TruckIcon,
} from '../icons';

export const NAVIGATION = {
  [ROLES.SUPERUSER]: [
    { to: '/superuser/dashboard', label: 'System Dashboard', Icon: GridIcon },
    { to: '/superuser/hierarchy', label: 'Organisation Hierarchy', Icon: HierarchyIcon },
    { to: '/superuser/hospital-registrations', label: 'Hospital Registrations', Icon: HomeIcon },
    { to: '/superuser/patient-directory', label: 'Patient Directory', Icon: UsersIcon },
    { to: '/superuser/manage-users', label: 'Manage Users', Icon: ManageUsersIcon },
    { to: '/superuser/system-settings', label: 'System Settings', Icon: SettingsIcon },
    { to: '/superuser/feedback', label: 'Feedback Review', Icon: ChatIcon },
    { to: '/superuser/revenue', label: 'Revenue Model', Icon: RupeeIcon },
    { to: '/superuser/reports', label: 'Reports & Analytics', Icon: PieIcon },
  ],
  [ROLES.HOSPITAL_MANAGER]: [
    { to: '/hospital-manager/overview', label: 'Overview', Icon: GridIcon },
    { to: '/hospital-manager/leaves', label: 'Doctor Leaves', Icon: LeaveIcon },
    { to: '/hospital-manager/schedules', label: 'Schedule Approvals', Icon: CalendarIcon },
    { to: '/hospital-manager/staff', label: 'Staff Directory', Icon: UsersIcon },
    { to: '/hospital-manager/setup', label: 'Registration, Setup & Assets', Icon: HomeIcon },
    { to: '/hospital-manager/inventory-approvals', label: 'Inventory Approvals', Icon: BoxIcon },
    { to: '/hospital-manager/ambulance', label: 'Ambulance Status', Icon: TruckIcon },
    { to: '/hospital-manager/subscription', label: 'Subscription & Renewal', Icon: CardIcon },
    { to: '/hospital-manager/revenue', label: 'Revenue', Icon: RupeeIcon },
    { to: '/hospital-manager/supervision', label: 'Admin Supervision', Icon: UserCheckIcon },
    { to: '/hospital-manager/support', label: 'Support Requests', Icon: AlertIcon },
    { to: '/hospital-manager/feedback', label: 'Patient Feedback', Icon: ChatIcon },
  ],
  [ROLES.REGIONAL_MANAGER]: [
    { to: '/regional-officer/dashboard', label: 'Regional Dashboard', Icon: GridIcon },
    { to: '/regional-officer/hierarchy', label: 'My Region', Icon: HierarchyIcon },
    { to: '/regional-officer/hospital-approvals', label: 'Hospital Approvals', Icon: HomeCheckIcon },
    { to: '/regional-officer/revenue', label: 'Revenue', Icon: RupeeIcon },
    { to: '/regional-officer/performance-alerts', label: 'Performance Alerts', Icon: AlertIcon },
    { to: '/regional-officer/hospital-comparison', label: 'Hospital Comparison', Icon: BarsIcon },
    { to: '/regional-officer/complaints', label: 'Patient Complaints', Icon: ChatIcon },
    { to: '/regional-officer/profile', label: 'My Profile', Icon: UserIcon },
  ],
  [ROLES.STAFF]: [
    { to: '/staff/dashboard', label: 'Dashboard', Icon: GridIcon },
    { to: '/staff/patient-checkin', label: 'Patient Check-in', Icon: UserCheckIcon },
    { to: '/staff/patient-directory', label: 'Patient Directory', Icon: UsersIcon },
    { to: '/staff/manage-appointments', label: 'Manage Appointments', Icon: CalendarIcon },
    { to: '/staff/bed-allocation', label: 'Bed Allocation', Icon: BedIcon },
    { to: '/staff/inventory', label: 'Inventory', Icon: BoxIcon },
    { to: '/staff/staff-scheduling', label: 'Staff Scheduling', Icon: CalendarIcon },
    { to: '/staff/leave-requests', label: 'Leave Requests', Icon: LeaveIcon },
    { to: '/staff/generate-bill', label: 'Generate Bill', Icon: RupeeIcon },
    { to: '/staff/feedback', label: 'Feedback', Icon: ChatIcon },
  ],
  [ROLES.DOCTOR]: [
    { to: '/doctor/dashboard', label: 'My Practice', Icon: GridIcon },
    { to: '/doctor/appointments', label: 'My Appointments', Icon: CalendarIcon },
    { to: '/doctor/leaves', label: 'Leave Calendar', Icon: LeaveIcon },
    { to: '/doctor/earnings', label: 'Earnings', Icon: RupeeIcon },
    { to: '/doctor/profile', label: 'My Profile', Icon: UserIcon },
  ],
  [ROLES.PATIENT]: [
    { to: '/patient/dashboard', label: 'Dashboard', Icon: GridIcon },
    { to: '/patient/hospital-search', label: 'Search Hospitals', Icon: SearchIcon },
    { to: '/patient/appointments', label: 'Appointments', Icon: CalendarIcon },
    { to: '/patient/ambulance', label: 'Ambulance Request', Icon: TruckIcon },
    { to: '/patient/billing', label: 'Billing & Payments', Icon: RupeeIcon },
    { to: '/patient/feedback', label: 'Feedback and Complaint', Icon: ChatIcon },
    { to: '/patient/membership', label: 'Care+ Membership', Icon: CardIcon },
    { to: '/patient/profile', label: 'Profile', Icon: UserIcon },
  ],
  [ROLES.AMBULANCE]: [
    { to: '/ambulance/dashboard', label: 'Dashboard', Icon: GridIcon },
    { to: '/ambulance/ambulance-requests', label: 'Incoming Requests', Icon: AlertIcon },
    { to: '/ambulance/assigned-dispatch', label: 'Assigned Dispatch', Icon: TruckIcon },
    { to: '/ambulance/active-transport', label: 'Active Transport', Icon: TruckIcon },
    { to: '/ambulance/completed-transports', label: 'Completed Transports', Icon: UserCheckIcon },
    { to: '/ambulance/profile', label: 'Profile', Icon: UserIcon },
  ],
};

export function menuFor(role) {
  return NAVIGATION[role] || [];
}
