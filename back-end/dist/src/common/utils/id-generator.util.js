"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdGenerator = void 0;
class IdGenerator {
    static generate(prefix) {
        return `${prefix}${Math.floor(Math.random() * 90000 + 10000)}`;
    }
    static generateUserId() {
        return this.generate('U');
    }
    static generatePatientId() {
        return this.generate('P');
    }
    static generateAppointmentId() {
        return this.generate('APT-');
    }
    static generateBillId() {
        return this.generate('BILL-');
    }
    static generateFeedbackId() {
        return this.generate('FB-');
    }
    static generateAmbulanceId() {
        return this.generate('AMB-');
    }
    static generateBedId() {
        return this.generate('E');
    }
    static generateInventoryId() {
        return this.generate('INV-');
    }
    static generateSystemActivityId() {
        return this.generate('ACT-');
    }
    static generatePaymentId() {
        return this.generate('PAY-');
    }
    static generateTokenId() {
        return this.generate('TKN-');
    }
}
exports.IdGenerator = IdGenerator;
//# sourceMappingURL=id-generator.util.js.map