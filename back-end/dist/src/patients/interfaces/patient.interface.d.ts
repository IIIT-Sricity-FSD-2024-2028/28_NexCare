export interface Patient {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    patientIdDisplay: string;
    memberSince: string;
    status: string;
    bloodGroup: string;
    age: number;
    city?: string;
    state?: string;
    pincode?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface CreatePatientRequest {
    id?: string;
    fullName: string;
    phone: string;
    email: string;
    bloodGroup?: string;
    age?: number;
    city?: string;
    state?: string;
    pincode?: string;
}
export interface UpdatePatientRequest {
    fullName?: string;
    phone?: string;
    email?: string;
    status?: string;
    bloodGroup?: string;
    age?: number;
}
export interface PatientStats {
    total: number;
    active: number;
    critical: number;
    averageAge: number;
    bloodGroupDistribution: Record<string, number>;
}
