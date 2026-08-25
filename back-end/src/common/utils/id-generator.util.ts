/**
 * Centralized ID Generator Utility
 * Eliminates duplicate ID generation logic across all services
 */

export class IdGenerator {
  // Per-process monotonic counter — guarantees uniqueness for IDs minted within
  // the same millisecond, which a bare Math.random() could not.
  private static counter = 0;

  /**
   * Generate a collision-resistant unique ID with the specified prefix.
   * Combines a millisecond timestamp, a per-process sequence, and randomness,
   * so IDs stay unique both within a burst and across server restarts.
   * @param prefix - The prefix for the ID (e.g., 'U', 'P', 'APT-')
   * @returns Generated unique ID string
   */
  static generate(prefix: string): string {
    const time = Date.now().toString(36);
    const seq = (IdGenerator.counter = (IdGenerator.counter + 1) % 1_000_000)
      .toString(36);
    const rand = Math.floor(Math.random() * 1296).toString(36).padStart(2, '0');
    return `${prefix}${time}${seq}${rand}`.toUpperCase();
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
