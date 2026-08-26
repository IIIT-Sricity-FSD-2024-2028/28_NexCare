# NexCare Backend API

A comprehensive NestJS backend foundation for the NexCare Hospital Management System, providing RESTful APIs for all hospital operations.

## 🏥 Overview

This backend provides a complete API foundation with:
- **10 Feature Modules** covering all hospital operations
- **RESTful CRUD Endpoints** with consistent response format
- **In-memory Mock Data** aligned with frontend structure
- **Professional NestJS Architecture** with modular design
- **Extension Points** for teammates to add validation, guards, and documentation

## 📁 Project Structure

```
back-end/
├── src/
│   ├── common/                 # Shared utilities and interfaces
│   │   ├── interfaces/         # API response interfaces and enums
│   │   ├── utils/              # Response formatting utilities
│   │   └── guards/             # Authentication and RBAC guards (placeholders)
│   ├── auth/                   # Authentication module
│   ├── users/                  # User management module
│   ├── patients/               # Patient records module
│   ├── appointments/           # Appointment scheduling module
│   ├── billing/                # Financial operations module
│   ├── ambulance/              # Emergency services module
│   ├── feedback/               # Communication system module
│   ├── beds/                   # Hospital bed management module
│   ├── inventory/              # Supply chain management module
│   ├── system/                 # Audit and configuration module
│   ├── app.module.ts           # Root application module
│   └── main.ts                 # Application bootstrap
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── nest-cli.json              # Nest CLI configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
cd back-end
npm install
```

### Running the Application
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

The API will be available at `http://localhost:3001/api`

## 📚 API Endpoints

### Authentication (`/api/auth`)
- `POST /auth/login` - User login
- `POST /auth/register` - Patient registration
- `POST /auth/logout/:userId` - User logout
- `GET /auth/current/:userId` - Get current session
- `GET /auth/sessions` - Get active sessions (admin)

### Users (`/api/users`)
- `GET /users` - Get all users with filtering
- `GET /users/:id` - Get user by ID
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `PATCH /users/:id` - Partial update user
- `DELETE /users/:id` - Delete user
- `GET /users/stats` - User statistics
- `GET /users/role/:role` - Users by role
- `PATCH /users/:id/status` - Update user status
- `GET /users/search/:query` - Search users

### Patients (`/api/patients`)
- `GET /patients` - Get all patients with filtering
- `GET /patients/:id` - Get patient by ID
- `POST /patients` - Create new patient
- `PUT /patients/:id` - Update patient
- `PATCH /patients/:id` - Partial update patient
- `DELETE /patients/:id` - Delete patient
- `GET /patients/stats` - Patient statistics
- `GET /patients/blood-group/:bloodGroup` - Patients by blood group
- `PATCH /patients/:id/status` - Update patient status
- `GET /patients/search/:query` - Search patients
- `GET /patients/age-range` - Patients by age range

### Appointments (`/api/appointments`)
- `GET /appointments` - Get all appointments with filtering
- `GET /appointments/:id` - Get appointment by ID
- `POST /appointments` - Create new appointment
- `PUT /appointments/:id` - Update appointment
- `PATCH /appointments/:id` - Partial update appointment
- `DELETE /appointments/:id` - Delete appointment
- `PATCH /appointments/:id/confirm` - Confirm appointment
- `PATCH /appointments/:id/complete` - Complete appointment
- `PATCH /appointments/:id/cancel` - Cancel appointment
- `GET /appointments/stats` - Appointment statistics
- `GET /appointments/patient/:patientId` - Appointments by patient
- `GET /appointments/department/:department` - Appointments by department
- `GET /appointments/today` - Today's appointments

### Billing (`/api/billing`)
- `GET /billing` - Get all bills with filtering
- `GET /billing/:id` - Get bill by ID
- `POST /billing` - Create new bill
- `PUT /billing/:id` - Update bill
- `PATCH /billing/:id` - Partial update bill
- `DELETE /billing/:id` - Delete bill
- `PATCH /billing/:id/pay` - Process payment
- `GET /billing/stats` - Bill statistics
- `GET /billing/patient/:patientId` - Bills by patient
- `GET /billing/overdue` - Overdue bills
- `GET /billing/revenue` - Revenue by date range

### Ambulance (`/api/ambulance`)
- `GET /ambulance` - Get all requests with filtering
- `GET /ambulance/:id` - Get request by ID
- `POST /ambulance` - Create new request
- `PUT /ambulance/:id` - Update request
- `PATCH /ambulance/:id` - Partial update request
- `DELETE /ambulance/:id` - Delete request
- `PATCH /ambulance/:id/dispatch` - Dispatch ambulance
- `PATCH /ambulance/:id/complete` - Complete request
- `PATCH /ambulance/:id/status` - Update status
- `GET /ambulance/stats` - Ambulance statistics
- `GET /ambulance/patient/:patientId` - Requests by patient
- `GET /ambulance/active` - Active requests
- `GET /ambulance/assigned/:assignedTo` - Requests by staff

### Feedback (`/api/feedback`)
- `GET /feedback` - Get all feedback with filtering
- `GET /feedback/:id` - Get feedback by ID
- `POST /feedback` - Create new feedback
- `PUT /feedback/:id` - Update feedback
- `PATCH /feedback/:id` - Partial update feedback
- `DELETE /feedback/:id` - Delete feedback
- `PATCH /feedback/:id/status` - Update status
- `GET /feedback/stats` - Feedback statistics
- `GET /feedback/patient/:patientId` - Feedback by patient
- `GET /feedback/category/:category` - Feedback by category
- `GET /feedback/rating/:rating` - Feedback by rating
- `GET /feedback/unresolved` - Unresolved feedback
- `GET /feedback/high-priority` - High priority feedback

### Beds (`/api/beds`)
- `GET /beds` - Get all beds with filtering
- `GET /beds/:id` - Get bed by ID
- `POST /beds` - Create new bed
- `PUT /beds/:id` - Update bed
- `PATCH /beds/:id` - Partial update bed
- `DELETE /beds/:id` - Delete bed
- `PATCH /beds/:id/allocate` - Allocate bed to patient
- `PATCH /beds/:id/release` - Release bed
- `PATCH /beds/:id/status` - Update bed status
- `GET /beds/stats` - Bed statistics
- `GET /beds/ward/:ward` - Beds by ward
- `GET /beds/available` - Available beds
- `GET /beds/patient/:patient` - Beds by patient
- `GET /beds/occupancy` - Occupancy by ward

### Inventory (`/api/inventory`)
- `GET /inventory` - Get all items with filtering
- `GET /inventory/:id` - Get item by ID
- `POST /inventory` - Create new item
- `PUT /inventory/:id` - Update item
- `PATCH /inventory/:id` - Partial update item
- `DELETE /inventory/:id` - Delete item
- `PATCH /inventory/:id/restock` - Restock item
- `PATCH /inventory/:id/use` - Use item
- `GET /inventory/stats` - Inventory statistics
- `GET /inventory/low-stock` - Low stock items
- `GET /inventory/out-of-stock` - Out of stock items
- `GET /inventory/category/:category` - Items by category
- `GET /inventory/location/:location` - Items by location
- `GET /inventory/search/:query` - Search items

### System (`/api/system`)
- `GET /system/activity` - Get all system activity
- `GET /system/activity/:id` - Get activity by ID
- `POST /system/activity` - Create system activity
- `GET /system/settings` - Get all settings
- `GET /system/settings/:id` - Get setting by ID
- `GET /system/settings/key/:key` - Get setting by key
- `PUT /system/settings/:id` - Update setting
- `GET /system/stats` - System statistics
- `GET /system/activity/date-range` - Activities by date range
- `GET /system/activity/user/:userId` - Activities by user
- `GET /system/activity/recent` - Recent activities
- `GET /system/settings/category/:category` - Settings by category
- `GET /system/activity/search/:query` - Search activities

### Uploads
- `POST /uploads` - Upload a document (multipart/form-data, field `file`)
- `GET /uploads?entityType=patient&entityId=P001` - List documents for a record
- `GET /uploads/:id` - Upload metadata
- `GET /uploads/:id/download` - Download the stored file
- `DELETE /uploads/:id` - Delete an upload

### Logs
- `GET /logs?stream=access|error|app&limit=100` - Recent log entries
- `GET /logs/files` - Log files on disk with sizes

## 🛡️ Middleware

Every request passes through the chain below. Nest runs middleware first, then
guards, then interceptors and pipes, then the controller; exception filters
format anything that fails on the way.

```
request
  → SecurityMiddleware        (headers, rate limit, payload limit)
  → RequestLoggerMiddleware   (request id, access log)
  → router-level middleware   (only on the routes it is bound to)
  → AuthGuard → RolesGuard    (JWT, role check)
  → interceptors / pipes      (query shaping, DTO validation)
  → controller
  ← AllExceptionsFilter       (formats + logs any failure)
  ← errorHandlerMiddleware    (Express-level: parser errors, unknown routes)
```

| Type | Implementation | Where it runs | What it does |
|---|---|---|---|
| **Logging** | `common/middleware/request-logger.middleware.ts` | every route | Assigns `x-request-id`, records method, path, status, duration, user and IP to `logs/access-*.log`; copies 4xx/5xx into `logs/error-*.log` |
| **Error handling** | `common/filters/all-exceptions.filter.ts` + `common/middleware/error-handler.middleware.ts` | every route | Filter catches *any* exception in a handler and returns the standard envelope; the Express-level handler covers what the filter cannot see — malformed JSON, oversized bodies, unknown routes. Both write to `logs/error-*.log` |
| **File upload** | `uploads/uploads.module.ts` (multer via `MulterModule`/`FileInterceptor`) + `uploads/middleware/file-upload.middleware.ts` | `POST /uploads` | Stores documents on disk with generated filenames, 5 MB limit, MIME allowlist; the router-level middleware rejects non-multipart or oversized requests before any bytes are written |
| **Security** | `common/middleware/security.middleware.ts` | every route | helmet security headers, per-IP sliding-window rate limiting (stricter on `/auth/login` and `/auth/register`), request body size limit; blocked requests are logged |
| **Router-level** | `beds/middleware/bed-status-change.middleware.ts`, `uploads/middleware/file-upload.middleware.ts` | bound routes only | Bed middleware validates status transitions (`maintenance → occupied` is refused) and logs every change with user and old → new status |

Application-level middleware is registered in `app.module.ts` via
`configure(consumer)`; router-level middleware is registered the same way
inside the feature module it belongs to (`beds.module.ts`, `uploads.module.ts`).

Also in the chain: `AuthGuard` and `RolesGuard` (global, `app.module.ts`),
`HospitalQueryInterceptor` (hospital search), `LeaveRequestGuard` (leave
requests) and the global `ValidationPipe`.

## 📝 Log & Error Management

Logs are buffered in memory and written to disk on a timer — see
`common/logging/file-logger.ts`.

| File | Contents |
|---|---|
| `logs/access-YYYY-MM-DD.log` | one entry per request |
| `logs/error-YYYY-MM-DD.log` | every 4xx/5xx response and every exception, with stack traces |
| `logs/app-YYYY-MM-DD.log` | lifecycle and business events (startup, uploads, shutdown) |

- Format is JSON lines — `tail -f logs/access-$(date +%F).log | jq .`
- Flushed every **5 s** (`LOG_FLUSH_INTERVAL_MS`), immediately for errors, and
  on shutdown (`SIGINT`/`SIGTERM`, uncaught exceptions).
- Rotated daily by filename, and whenever a file passes 5 MB.
- Readable through the API — `GET /logs?stream=error&limit=100` and
  `GET /logs/files` (superuser / administrative staff) — and in the admin
  portal under **System Logs**.

Passwords and tokens are redacted before anything is written.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `LOG_FLUSH_INTERVAL_MS` | `5000` | How often buffered logs are written |
| `RATE_LIMIT_GENERAL` | `300` | Requests per IP per window |
| `RATE_LIMIT_AUTH` | `20` | Login/register attempts per IP per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window |
| `RATE_LIMIT_DISABLED` | `false` | Set `true` to switch rate limiting off |
| `MAX_BODY_BYTES` | `1048576` | Largest JSON body accepted |
| `MAX_UPLOAD_BYTES` | `5242880` | Largest file accepted |

## 🎯 API Response Format

All endpoints return a consistent JSON response format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2026-04-02T10:15:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information",
  "timestamp": "2026-04-02T10:15:00.000Z"
}
```

## 🔧 Technology Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Architecture**: Modular with Dependency Injection
- **Data**: In-memory mock data (production ready for database integration)
- **Validation**: Ready for class-validator decorators
- **Authentication**: Ready for JWT implementation
- **Documentation**: Ready for Swagger/OpenAPI integration

## 👥 Team Extension Points

This foundation provides clear extension points for teammates:

### 1. DTO Validation
- Add class-validator decorators to all DTO files
- Implement custom validation rules
- Add validation pipes

### 2. Authentication & Authorization
- Implement JWT tokens in AuthGuard
- Add role-based access control in RolesGuard
- Integrate with external authentication providers

### 3. Database Integration
- Replace in-memory data with TypeORM entities
- Add database repositories
- Implement data migrations

### 4. API Documentation
- Add Swagger decorators to all endpoints
- Configure OpenAPI documentation
- Add request/response examples

### 5. Error Handling
- Implement global exception filters
- Add custom error classes
- Enhance error logging

### 6. Testing
- Add unit tests for all services
- Add integration tests for controllers
- Add E2E tests for critical flows

## 📊 Mock Data Alignment

The backend mock data is perfectly aligned with the frontend `db.js` structure:
- **Users**: 9 users across all roles (Superuser, Admin, Staff, Patient, Doctor, Nurse)
- **Patients**: 15 patients with complete medical information
- **Appointments**: 7 appointments with various statuses
- **Bills**: 2 bills with GST calculations
- **Ambulance Requests**: 2 emergency requests
- **Feedback**: 3 feedback entries
- **Beds**: 20 beds across 4 wards
- **Inventory**: 10 medical supplies and equipment
- **System Activity**: 5 activity logs
- **Settings**: 5 system configuration options

## 🚀 Next Steps

1. Install dependencies: `npm install`
2. Run development server: `npm run start:dev`
3. Test endpoints with Postman or similar tool
4. Teammates can extend with validation, authentication, and database integration

## 📞 Support

For questions about the backend foundation or extension points, refer to the module-specific documentation in each feature module directory.
