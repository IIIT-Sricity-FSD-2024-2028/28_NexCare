"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveStatus = exports.InventoryStatus = exports.FeedbackStatus = exports.BedStatus = exports.AmbulanceStatus = exports.BillStatus = exports.AppointmentStatus = exports.UserStatus = exports.VerificationStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["PATIENT"] = "patient";
    UserRole["ADMINISTRATIVE_STAFF"] = "administrative_staff";
    UserRole["SUPERUSER"] = "superuser";
    UserRole["AMBULANCE"] = "ambulance";
    UserRole["DOCTOR"] = "doctor";
    UserRole["NURSE"] = "nurse";
    UserRole["REGIONAL_MANAGER"] = "regional_manager";
    UserRole["HOSPITAL_MANAGER"] = "hospital_manager";
})(UserRole || (exports.UserRole = UserRole = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "pending_verification";
    VerificationStatus["PENDING_VERIFICATION"] = "pending_verification";
    VerificationStatus["VERIFIED"] = "verified";
    VerificationStatus["REJECTED"] = "rejected";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "Active";
    UserStatus["INACTIVE"] = "Inactive";
    UserStatus["ON_LEAVE"] = "On Leave";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["PENDING"] = "Pending";
    AppointmentStatus["CONFIRMED"] = "Confirmed";
    AppointmentStatus["COMPLETED"] = "Completed";
    AppointmentStatus["CANCELLED"] = "Cancelled";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var BillStatus;
(function (BillStatus) {
    BillStatus["PENDING"] = "Pending";
    BillStatus["PAID"] = "Paid";
    BillStatus["OVERDUE"] = "Overdue";
    BillStatus["CANCELLED"] = "Cancelled";
})(BillStatus || (exports.BillStatus = BillStatus = {}));
var AmbulanceStatus;
(function (AmbulanceStatus) {
    AmbulanceStatus["PENDING"] = "Pending";
    AmbulanceStatus["DISPATCHED"] = "Dispatched";
    AmbulanceStatus["EN_ROUTE"] = "En Route";
    AmbulanceStatus["PICKED_UP"] = "Picked Up";
    AmbulanceStatus["AT_HOSPITAL"] = "At Hospital";
    AmbulanceStatus["COMPLETED"] = "Completed";
})(AmbulanceStatus || (exports.AmbulanceStatus = AmbulanceStatus = {}));
var BedStatus;
(function (BedStatus) {
    BedStatus["AVAILABLE"] = "available";
    BedStatus["OCCUPIED"] = "occupied";
    BedStatus["CRITICAL"] = "critical";
    BedStatus["MAINTENANCE"] = "maintenance";
})(BedStatus || (exports.BedStatus = BedStatus = {}));
var FeedbackStatus;
(function (FeedbackStatus) {
    FeedbackStatus["OPEN"] = "Open";
    FeedbackStatus["IN_PROGRESS"] = "In Progress";
    FeedbackStatus["RESOLVED"] = "Resolved";
})(FeedbackStatus || (exports.FeedbackStatus = FeedbackStatus = {}));
var InventoryStatus;
(function (InventoryStatus) {
    InventoryStatus["IN_STOCK"] = "In Stock";
    InventoryStatus["LOW_STOCK"] = "Low Stock";
    InventoryStatus["OUT_OF_STOCK"] = "Out of Stock";
})(InventoryStatus || (exports.InventoryStatus = InventoryStatus = {}));
var LeaveStatus;
(function (LeaveStatus) {
    LeaveStatus["PENDING"] = "pending";
    LeaveStatus["APPROVED"] = "approved";
    LeaveStatus["REJECTED"] = "rejected";
})(LeaveStatus || (exports.LeaveStatus = LeaveStatus = {}));
//# sourceMappingURL=api-response.interface.js.map