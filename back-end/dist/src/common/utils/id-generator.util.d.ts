export declare class IdGenerator {
    private static counter;
    static generate(prefix: string): string;
    static generateUserId(): string;
    static generatePatientId(): string;
    static generateAppointmentId(): string;
    static generateBillId(): string;
    static generateFeedbackId(): string;
    static generateAmbulanceId(): string;
    static generateBedId(): string;
    static generateInventoryId(): string;
    static generateSystemActivityId(): string;
    static generatePaymentId(): string;
    static generateTokenId(): string;
}
