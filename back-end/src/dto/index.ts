// Auth DTOs
export { LoginDto } from '../auth/dto/login.dto';
export { RegisterDto } from '../auth/dto/register.dto';

// Users DTOs
export { CreateUserDto } from '../users/dto/create-user.dto';
export { UpdateUserDto } from '../users/dto/update-user.dto';

// Patients DTOs
export { CreatePatientDto } from '../patients/dto/create-patient.dto';
export { UpdatePatientDto } from '../patients/dto/update-patient.dto';

// Appointments DTOs
export { CreateAppointmentDto } from '../appointments/dto/create-appointment.dto';
export { UpdateAppointmentDto } from '../appointments/dto/update-appointment.dto';
export { ConfirmAppointmentDto } from '../appointments/dto/confirm-appointment.dto';

// Billing DTOs
export { CreateBillDto } from '../billing/dto/create-bill.dto';
export { UpdateBillDto } from '../billing/dto/update-bill.dto';
export { ProcessPaymentDto } from '../billing/dto/process-payment.dto';

// Ambulance DTOs
export { CreateAmbulanceRequestDto } from '../ambulance/dto/create-request.dto';
export { UpdateAmbulanceRequestDto } from '../ambulance/dto/update-request.dto';
export { DispatchAmbulanceDto } from '../ambulance/dto/dispatch-ambulance.dto';

// Feedback DTOs
export { CreateFeedbackDto } from '../feedback/dto/create-feedback.dto';
export { UpdateFeedbackDto } from '../feedback/dto/update-feedback.dto';
export { ResolveFeedbackDto } from '../feedback/dto/resolve-feedback.dto';

// Beds DTOs
export { CreateBedDto } from '../beds/dto/create-bed.dto';
export { UpdateBedDto } from '../beds/dto/update-bed.dto';
export { AllocateBedDto } from '../beds/dto/allocate-bed.dto';

// Inventory DTOs
export { CreateInventoryDto } from '../inventory/dto/create-inventory.dto';
export { UpdateInventoryDto } from '../inventory/dto/update-inventory.dto';
export { RestockInventoryDto } from '../inventory/dto/restock-inventory.dto';

// System DTOs
export { CreateSystemActivityDto } from '../system/dto/create-activity.dto';
export { UpdateSystemSettingsDto } from '../system/dto/update-settings.dto';

// Common DTOs
export { QueryParamsDto } from '../common/dto/query-params.dto';
export { DateRangeDto } from '../common/dto/date-range.dto';
