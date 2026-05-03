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
 */
export enum UserRole {
  PATIENT = 'patient',
  ADMINISTRATIVE_STAFF = 'administrative_staff',
  SUPERUSER = 'superuser',
  AMBULANCE = 'ambulance',
  DOCTOR = 'doctor',
  NURSE = 'nurse'
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
  COMPLETED = 'Completed'
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
