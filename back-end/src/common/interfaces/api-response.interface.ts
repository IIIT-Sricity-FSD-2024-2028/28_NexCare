/**
 * Standard API Response Interface for NexCare Backend
 * Ensures consistent response format across all endpoints
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
}


/**
 * User Roles Enumeration
 *
 * NexCare is a strictly non-clinical platform, so the roles split in two:
 *
 *  Login actors — each owns a portal and can be issued a session:
 *    patient, administrative_staff, ambulance, superuser,
 *    regional_manager (displayed as "Regional Officer"), hospital_manager.
 *
 *  Directory-only records — no portal, no login (enforced in AuthService.login
 *  and excluded from staff self-registration). They exist so an appointment can
 *  name the consultant a slot belongs to and so rosters, leave records, and
 *  headcount statistics can reference clinical staff:
 *    doctor, nurse.
 *
 * ADMINISTRATIVE_STAFF is displayed as "Administrative Staff". "Front Desk" is a
 * department within that role, never the role itself.
 */
export enum UserRole {
  PATIENT = 'patient',
  ADMINISTRATIVE_STAFF = 'administrative_staff',
  SUPERUSER = 'superuser',
  AMBULANCE = 'ambulance',
  REGIONAL_MANAGER = 'regional_manager',
  HOSPITAL_MANAGER = 'hospital_manager',
  // Directory-only — see note above.
  DOCTOR = 'doctor',
  NURSE = 'nurse'
}

/**
 * Hospital Verification Status Enumeration
 */
export enum VerificationStatus {
  PENDING = 'pending_verification',
  PENDING_VERIFICATION = 'pending_verification',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

/**
 * User Status Enumeration
 */
export enum UserStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  ON_LEAVE = 'On Leave'
}

/**
 * Appointment Status Enumeration
 */
export enum AppointmentStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

/**
 * Bill Status Enumeration
 */
export enum BillStatus {
  PENDING = 'Pending',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled'
}

/**
 * Ambulance Request Status Enumeration
 */
export enum AmbulanceStatus {
  PENDING = 'Pending',
  DISPATCHED = 'Dispatched',
  EN_ROUTE = 'En Route',
  PICKED_UP = 'Picked Up',
  AT_HOSPITAL = 'At Hospital',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

/**
 * Bed Status Enumeration
 */
export enum BedStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  CRITICAL = 'critical',
  MAINTENANCE = 'maintenance'
}

/**
 * Feedback Status Enumeration
 */
export enum FeedbackStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved'
}

/**
 * Inventory Status Enumeration
 */
export enum InventoryStatus {
  IN_STOCK = 'In Stock',
  LOW_STOCK = 'Low Stock',
  OUT_OF_STOCK = 'Out of Stock'
}

/**
 * Leave Status Enumeration
 */
export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

/**
 * Inventory Requirement Status Enumeration
 */
export enum InventoryRequirementStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  PENDING = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PURCHASE_IN_PROGRESS = 'PURCHASE_IN_PROGRESS',
  PURCHASED = 'PURCHASED',
  RESTOCKED = 'RESTOCKED',
  ORDERED = 'PURCHASE_IN_PROGRESS',
  FULFILLED = 'RESTOCKED'
}

/**
 * Inventory Priority Enumeration
 */
export enum InventoryPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

/**
 * Hospital Subscription Status
 */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  DUE_SOON = 'DUE_SOON',
  EXPIRED = 'EXPIRED',
  OVERDUE = 'OVERDUE'
}

