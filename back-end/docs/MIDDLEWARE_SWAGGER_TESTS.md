# Middleware Swagger Tests

This document outlines the procedures to test the NexCare middlewares and their respective access control, data constraints, and business logic using the interactive Swagger documentation.

## Test Cases for Middleware

### 1. Hospital Query & Access (`HospitalsController`)
**Target Endpoint**: `GET /api/hospitals/nearby`
- **Objective**: Verify that `x-query-timestamp` is correctly exposed.
- **Pre-requisite**: No authentication required.
- **Steps**:
  1. Open the `/api/hospitals/nearby` endpoint in Swagger.
  2. Input test data: `city = Tirupati`, `state = Andhra Pradesh`, `pincode = 517501`.
  3. Execute the request.
- **Expected Result**: 
  - Status Code: 200 OK
  - Headers should include `x-query-timestamp`.

**Target Endpoint**: `PUT /api/hospitals/{id}`
- **Objective**: Verify cross-hospital access denial (`HospitalAccessMiddleware`).
- **Pre-requisite**: Authenticate as a Hospital Manager for `H001` (e.g. `admin@nexcare.com` if assigned to H001).
- **Steps**:
  1. Login with a Hospital Manager account assigned to `H001`.
  2. Click Authorize and input the JWT token.
  3. Execute `PUT /api/hospitals/{id}` with `id = H002`.
- **Expected Result**: 
  - Status Code: 403 Forbidden
  - Message: "Cross-hospital access denied. You can only update your assigned hospital."

### 2. Bed Status Machine (`BedsController`)
**Target Endpoint**: `PATCH /api/beds/{id}/allocate`
- **Objective**: Verify illegal status transitions (`BedStatusChangeMiddleware`).
- **Steps**:
  1. Locate a bed with `status: MAINTENANCE`.
  2. Execute `PATCH /api/beds/{id}/allocate` on that bed.
- **Expected Result**:
  - Status Code: 400 Bad Request
  - Message indicating an invalid transition (since only AVAILABLE or CRITICAL beds can be allocated).

### 3. Ambulance Access (`AmbulanceController`)
**Target Endpoint**: `GET /api/ambulance/{id}`
- **Objective**: Verify patient-scoped access (`AmbulanceAccessMiddleware`).
- **Pre-requisite**: Authenticate as a Patient (e.g. `P001` or another patient ID).
- **Steps**:
  1. Login with a Patient account and set Bearer token in Swagger.
  2. Try to access an ambulance request belonging to *another* patient.
- **Expected Result**:
  - Status Code: 403 Forbidden
  - Message: "You can only access your own ambulance requests."

### 4. File Upload Limits (`UploadsController`)
**Target Endpoint**: `POST /api/uploads`
- **Objective**: Verify the 5MB file upload limit (`FileUploadMiddleware`).
- **Steps**:
  1. Login as Superuser (`superuser@nexcare.com`).
  2. Authorize in Swagger.
  3. Upload a file larger than 5MB on `POST /api/uploads`.
- **Expected Result**:
  - Status Code: 413 Payload Too Large
  - Message: "File exceeds the 5MB size limit."

## Notes
The Swagger documentation has been updated to reflect accurate return codes (400, 401, 403, 404, 413, etc.), include appropriate Request schemas, and provide real JSON mock IDs to allow true verification without altering application behavior.
