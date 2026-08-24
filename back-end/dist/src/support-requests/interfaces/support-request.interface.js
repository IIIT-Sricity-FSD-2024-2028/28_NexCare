"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportRequestPriority = exports.SupportRequestStatus = void 0;
var SupportRequestStatus;
(function (SupportRequestStatus) {
    SupportRequestStatus["OPEN"] = "open";
    SupportRequestStatus["IN_PROGRESS"] = "in_progress";
    SupportRequestStatus["WAITING_FOR_HOSPITAL"] = "waiting_for_hospital";
    SupportRequestStatus["WAITING_FOR_MANAGER"] = "waiting_for_manager";
    SupportRequestStatus["RESOLVED"] = "resolved";
    SupportRequestStatus["CLOSED"] = "closed";
})(SupportRequestStatus || (exports.SupportRequestStatus = SupportRequestStatus = {}));
var SupportRequestPriority;
(function (SupportRequestPriority) {
    SupportRequestPriority["LOW"] = "low";
    SupportRequestPriority["MEDIUM"] = "medium";
    SupportRequestPriority["HIGH"] = "high";
    SupportRequestPriority["URGENT"] = "urgent";
})(SupportRequestPriority || (exports.SupportRequestPriority = SupportRequestPriority = {}));
//# sourceMappingURL=support-request.interface.js.map