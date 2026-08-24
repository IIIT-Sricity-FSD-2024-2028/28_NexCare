export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    timestamp?: string;
}
export declare enum UserRole {
    PATIENT = "patient",
    ADMINISTRATIVE_STAFF = "administrative_staff",
    SUPERUSER = "superuser",
    AMBULANCE = "ambulance",
    DOCTOR = "doctor",
    NURSE = "nurse",
    REGIONAL_MANAGER = "regional_manager",
    HOSPITAL_MANAGER = "hospital_manager"
}
export declare enum VerificationStatus {
    PENDING = "pending_verification",
    PENDING_VERIFICATION = "pending_verification",
    VERIFIED = "verified",
    REJECTED = "rejected"
}
export declare enum UserStatus {
    ACTIVE = "Active",
    INACTIVE = "Inactive",
    ON_LEAVE = "On Leave"
}
export declare enum AppointmentStatus {
    PENDING = "Pending",
    CONFIRMED = "Confirmed",
    COMPLETED = "Completed",
    CANCELLED = "Cancelled"
}
export declare enum BillStatus {
    PENDING = "Pending",
    PAID = "Paid",
    OVERDUE = "Overdue",
    CANCELLED = "Cancelled"
}
export declare enum AmbulanceStatus {
    PENDING = "Pending",
    DISPATCHED = "Dispatched",
    EN_ROUTE = "En Route",
    PICKED_UP = "Picked Up",
    AT_HOSPITAL = "At Hospital",
    COMPLETED = "Completed"
}
export declare enum BedStatus {
    AVAILABLE = "available",
    OCCUPIED = "occupied",
    CRITICAL = "critical",
    MAINTENANCE = "maintenance"
}
export declare enum FeedbackStatus {
    OPEN = "Open",
    IN_PROGRESS = "In Progress",
    RESOLVED = "Resolved"
}
export declare enum InventoryStatus {
    IN_STOCK = "In Stock",
    LOW_STOCK = "Low Stock",
    OUT_OF_STOCK = "Out of Stock"
}
export declare enum LeaveStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
