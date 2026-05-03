/**
 * Centralized ID Generator Utility
 * Eliminates duplicate ID generation logic across all services
 */

export class IdGenerator {
  /**
   * Generate a unique ID with specified prefix
   * @param prefix - The prefix for the ID (e.g., 'U', 'P', 'APT-')
   * @returns Generated unique ID string
   */
  static generate(prefix: string): string {
    return `${prefix}${Math.floor(Math.random() * 90000 + 10000)}`;
  }

  /**
   * Generate user ID
   */
  static generateUserId(): string {
    return this.generate('U');
  }

  /**
   * Generate patient ID
   */
  static generatePatientId(): string {
    return this.generate('P');
  }

  /**
   * Generate appointment ID
   */
  static generateAppointmentId(): string {
    return this.generate('APT-');
  }

  /**
   * Generate bill ID
   */
  static generateBillId(): string {
    return this.generate('BILL-');
  }

  /**
   * Generate feedback ID
   */
  static generateFeedbackId(): string {
    return this.generate('FB-');
  }

  /**
   * Generate ambulance request ID
   */
  static generateAmbulanceId(): string {
    return this.generate('AMB-');
  }

  /**
   * Generate bed ID
   */
  static generateBedId(): string {
    return this.generate('E');
  }

  /**
   * Generate inventory item ID
   */
  static generateInventoryId(): string {
    return this.generate('INV-');
  }

  /**
   * Generate system activity ID
   */
  static generateSystemActivityId(): string {
    return this.generate('ACT-');
  }

  /**
   * Generate payment ID
   */
  static generatePaymentId(): string {
    return this.generate('PAY-');
  }

  /**
   * Generate token ID
   */
  static generateTokenId(): string {
    return this.generate('TKN-');
  }
}
