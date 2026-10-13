export function isEmpty(value) {
    return !value || value.trim() === "";
}

export function isValidNumber(value) {
    return !isNaN(value) && Number(value) > 0;
}

export function isValidPhone(phone) {
    return /^[0-9]{10}$/.test(phone);
}

export function isDuplicate(value, list) {
    return list.includes(value);
}

export function isValidPatientName(name) {
    if (!name) return false;

    const trimmed = name.trim();

    // Reject if contains anything except letters and spaces
    if (!/^[A-Za-z ]+$/.test(trimmed)) return false;

    // Reject multiple spaces
    if (trimmed.includes("  ")) return false;

    // Must be at least 3 chars
    if (trimmed.length < 3) return false;

    return true;
}

/* ---------- Form Validators ---------- */

export function validateBillForm({ name, amount, services }) {

    if (!isValidPatientName(name)) {
        return "Patient name must contain only letters, single spaces, and be at least 3 characters";
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        return "Amount must be a valid number";
    }

    if (!services || services.trim().length < 2) {
        return "Services must be valid";
    }

    return null;
}

export function validateCheckin(name, existingPatients) {

    if (!isValidPatientName(name)) {
        return "Enter a valid patient name (only letters, min 3 chars)";
    }

    if (isDuplicate(name.trim(), existingPatients)) {
        return "Duplicate check-in not allowed";
    }

    return null;
}

export function validateProfile({ name, phone, vehicle }) {
    if (isEmpty(name)) return "Name required";
    if (!isValidPhone(phone)) return "Invalid phone number";
    if (isEmpty(vehicle)) return "Vehicle required";
    return null;
}

export function validateShift({ staff, time }) {
    if (isEmpty(staff)) return "Staff name required";
    if (isEmpty(time)) return "Shift time required";
    return null;
}

export function validateBedUpdate({ name, status }) {

    if (status !== "available") {
        if (!isValidPatientName(name)) {
            return "Valid patient name required (only letters, min 3 chars)";
        }
    }

    return null;
}

export function validateInventoryUpdate({ qty }) {

    if (isEmpty(qty)) {
        return "Quantity is required";
    }

    if (!isValidNumber(qty)) {
        return "Quantity must be a valid number greater than 0";
    }

    if (!Number.isInteger(Number(qty))) {
        return "Quantity must be a whole number";
    }
    
    return null;
}

export function validateAdmitPatient(name) {
    if (!isValidPatientName(name)) {
        return "Enter a valid patient name (only letters, min 3 chars)";
    }
    return null;
}