# NexCare Backend DTOs

This directory contains all Data Transfer Objects (DTOs) for the NexCare Hospital Management System backend. Following proper DTO patterns, these are **simple data containers** without validation logic or business rules.

## 🎯 DTO Principles

### What DTOs ARE:
- **Simple data containers** - Just fields to transfer data
- **Serializable** - Easy to convert to/from JSON
- **Lightweight** - No dependencies, no business logic
- **Flat structure** - Avoid deep nesting when possible
- **Focused on data transfer** - Not processing or validation

### What DTOs ARE NOT:
- ❌ **Not for validation** - Validation belongs in service layer
- ❌ **Not for business logic** - Keep business rules separate
- ❌ **Not for database operations** - No repositories or entities
- ❌ **Not for complex transformations** - Keep mapping separate

## 📁 Structure

```
src/
├── auth/dto/
│   ├── login.dto.ts
│   └── register.dto.ts
├── users/dto/
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
├── patients/dto/
│   ├── create-patient.dto.ts
│   └── update-patient.dto.ts
├── appointments/dto/
│   ├── create-appointment.dto.ts
│   ├── update-appointment.dto.ts
│   └── confirm-appointment.dto.ts
├── billing/dto/
│   ├── create-bill.dto.ts
│   ├── update-bill.dto.ts
│   └── process-payment.dto.ts
├── ambulance/dto/
│   ├── create-request.dto.ts
│   ├── update-request.dto.ts
│   └── dispatch-ambulance.dto.ts
├── feedback/dto/
│   ├── create-feedback.dto.ts
│   ├── update-feedback.dto.ts
│   └── resolve-feedback.dto.ts
├── beds/dto/
│   ├── create-bed.dto.ts
│   ├── update-bed.dto.ts
│   └── allocate-bed.dto.ts
├── inventory/dto/
│   ├── create-inventory.dto.ts
│   ├── update-inventory.dto.ts
│   └── restock-inventory.dto.ts
├── system/dto/
│   ├── create-activity.dto.ts
│   └── update-settings.dto.ts
├── common/dto/
│   ├── query-params.dto.ts
│   └── date-range.dto.ts
└── index.ts
```

## 🎯 Features

### Validation Decorators Used
- `@IsString()` - String validation
- `@IsEmail()` - Email format validation
- `@IsNumber()` - Number validation
- `@IsEnum()` - Enum validation
- `@IsOptional()` - Optional fields
- `@MinLength()` / `@MaxLength()` - String length validation
- `@Min()` / `@Max()` - Number range validation
- `@Matches()` - Regex pattern validation
- `@IsNotEmpty()` - Required field validation
- `@ValidateNested()` - Nested object validation
- `@Type()` - Type transformation

### Common Validations
- **Email**: Proper email format validation
- **Phone**: International phone number format
- **Blood Group**: A/B/AB/O with +/- format
- **Password**: Minimum 8 characters with complexity requirements
- **Dates**: YYYY-MM-DD format
- **IDs**: String validation with length limits

## 📋 Module-wise DTOs

### Auth Module
- **LoginDto**: Simple login credentials container
- **RegisterDto**: Patient registration data container

### Users Module
- **CreateUserDto**: User creation data container
- **UpdateUserDto**: User update data container

### Patients Module
- **CreatePatientDto**: Patient registration data container
- **UpdatePatientDto**: Patient profile update container

### Appointments Module
- **CreateAppointmentDto**: Appointment booking data container
- **UpdateAppointmentDto**: Appointment modification container
- **ConfirmAppointmentDto**: Appointment confirmation container

### Billing Module
- **CreateBillDto**: Bill creation data container
- **UpdateBillDto**: Bill update container
- **ProcessPaymentDto**: Payment processing container

### Ambulance Module
- **CreateAmbulanceRequestDto**: Emergency request data container
- **UpdateAmbulanceRequestDto**: Request update container
- **DispatchAmbulanceDto**: Dispatch operation container

### Feedback Module
- **CreateFeedbackDto**: Feedback submission container
- **UpdateFeedbackDto**: Feedback management container
- **ResolveFeedbackDto**: Resolution operation container

### Beds Module
- **CreateBedDto**: Bed creation container
- **UpdateBedDto**: Bed status update container
- **AllocateBedDto**: Allocation operation container

### Inventory Module
- **CreateInventoryDto**: Item creation container
- **UpdateInventoryDto**: Inventory update container
- **RestockInventoryDto**: Restocking operation container

### System Module
- **CreateSystemActivityDto**: Activity logging container
- **UpdateSystemSettingsDto**: Settings management container

### Common DTOs
- **QueryParamsDto**: Pagination and filtering container
- **DateRangeDto**: Date range filtering container

## 🔧 Usage

### Importing DTOs
```typescript
// Individual import
import { CreatePatientDto } from './patients/dto/create-patient.dto';

// Bulk import
import { CreatePatientDto, UpdatePatientDto, CreateAppointmentDto } from './dto';
```

### Using in Controllers
```typescript
@Post()
async createPatient(@Body() createPatientDto: CreatePatientDto) {
  // Validation happens in service layer
  return this.patientsService.create(createPatientDto);
}
```

### Using in Services
```typescript
async createPatient(createPatientDto: CreatePatientDto) {
  // Validate data using ValidationService
  const emailValidation = ValidationService.validateEmail(createPatientDto.email);
  if (!emailValidation) {
    throw new BadRequestException('Invalid email format');
  }
  
  // Business logic here
  return this.patientRepository.save(createPatientDto);
}
```

## 🚀 Validation Architecture

### Separation of Concerns
- **DTOs**: Simple data containers - no validation logic
- **ValidationService**: Centralized validation logic
- **Services**: Business logic with validation calls
- **Controllers**: HTTP handling - no validation

### Validation Service
The `ValidationService` provides reusable validation methods:
```typescript
import { ValidationService } from './common/services/validation.service';

// Email validation
ValidationService.validateEmail(email);

// Phone validation
ValidationService.validatePhone(phone);

// Password complexity
ValidationService.validatePassword(password);

// String length
ValidationService.validateStringLength(value, 2, 100);
```

## 📝 Enums Used

### User Roles
- `PATIENT`, `ADMINISTRATIVE_STAFF`, `SUPERUSER`, `AMBULANCE`, `DOCTOR`, `NURSE`

### Status Enums
- `AppointmentStatus`: PENDING, CONFIRMED, COMPLETED, CANCELLED
- `BillStatus`: PENDING, PAID, OVERDUE, CANCELLED
- `AmbulanceStatus`: PENDING, DISPATCHED, EN_ROUTE, PICKED_UP, AT_HOSPITAL, COMPLETED
- `BedStatus`: AVAILABLE, OCCUPIED, CRITICAL, MAINTENANCE
- `FeedbackStatus`: OPEN, IN_PROGRESS, RESOLVED
- `InventoryStatus`: IN_STOCK, LOW_STOCK, OUT_OF_STOCK

## 🔍 Validation Examples

### Patient Registration
```typescript
const patientData = {
  fullName: "John Doe",           // Required, 2-100 chars
  email: "john@example.com",     // Valid email required
  phone: "+1234567890",         // Valid phone format
  bloodGroup: "A+",             // Optional, A/B/AB/O with +/-
  age: 30                       // Optional, positive number
};
```

### Appointment Booking
```typescript
const appointmentData = {
  patientId: "patient123",      // Required string
  department: "Cardiology",      // Required, 2-100 chars
  doctor: "Dr. Smith",          // Optional, max 100 chars
  dateLabel: "2024-01-15",      // Required date string
  timeLabel: "10:30 AM",        // Required time string
  fee: 150.00,                  // Optional positive number
  reason: "Regular checkup"     // Optional, max 500 chars
};
```

## 🛡️ Security Features

- Input sanitization through validation decorators
- SQL injection prevention via typed inputs
- XSS protection through string validation
- Data type enforcement
- Length limits to prevent buffer overflow attacks

## 📊 Error Handling

Validation errors are automatically formatted and returned with:
- Field-specific error messages
- Validation constraint details
- HTTP 400 Bad Request status
- Structured error response format

## 🔄 Next Steps

1. Add custom validation decorators for business rules
2. Implement conditional validation based on user roles
3. Add file upload DTOs for document management
4. Create audit trail DTOs for compliance
5. Add localization support for error messages

## 📞 Support

For questions about DTO validation or to request new validation rules, refer to the module-specific documentation or contact the development team.
