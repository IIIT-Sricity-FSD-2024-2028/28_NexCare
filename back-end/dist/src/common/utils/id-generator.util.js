"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdGenerator = void 0;
class IdGenerator {
    static generate(prefix) {
        const time = Date.now().toString(36);
        const seq = (IdGenerator.counter = (IdGenerator.counter + 1) % 1_000_000)
            .toString(36);
        const rand = Math.floor(Math.random() * 1296).toString(36).padStart(2, '0');
        return `${prefix}${time}${seq}${rand}`.toUpperCase();
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
IdGenerator.counter = 0;
//# sourceMappingURL=id-generator.util.js.map