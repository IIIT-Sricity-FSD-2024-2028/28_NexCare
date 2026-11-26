export {
  fetchStaffAppointments, createStaffAppointment, editStaffAppointment, deleteStaffAppointment, selectStaffAppointments,
} from './appointmentsSlice';
export { fetchPatientDirectory, selectStaffPatients } from './directorySlices';
export { fetchBeds, allocateBed, updateBed, setWard, selectBeds } from './bedsSlice';
export {
  fetchInventory, consumeInventoryItem, restockItem, fetchRequisitions, createRequisition,
  createInventoryItem, deleteInventoryItem, startPurchase, markPurchased, markRestocked, fetchInventoryAudit, selectInventory,
} from './inventorySlice';
export { fetchSchedules, createSchedule, deleteSchedule, selectSchedules } from './schedulesSlice';
export { fetchLeaveRequests, createLeaveRequest, deleteStaffLeave, selectLeaveRequests } from './leavesSlice';
export { fetchStaffFeedback, selectStaffFeedback } from './feedbackSlice';
export { fetchBills, generateBill, selectStaffBilling } from './billingSlice';
