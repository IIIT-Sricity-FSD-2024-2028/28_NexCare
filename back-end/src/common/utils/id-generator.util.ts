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
   * Generate patient ID with sequential pattern (P001, P002, etc.)
   * This maintains consistency with existing patient IDs
   * @param existingIds - Array of existing patient IDs to avoid conflicts
   */
  static generatePatientId(existingIds: string[] = []): string {
    // Extract numeric parts from existing IDs (P001 -> 1, P010 -> 10, etc.)
    const numericIds = existingIds
      .map(id => {
        const match = id.match(/^P(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);

    // Find the highest existing ID
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
    
    // Generate the next sequential ID
    const nextId = maxId + 1;
    return `P${nextId.toString().padStart(3, '0')}`;
  }

  /**
   * Generate appointment ID
   */
  static generateAppointmentId(): string {
    return this.generate('APT-');
  }

  /**
   * Generate bill ID with sequential pattern (BILL-0001, BILL-0002, etc.)
   * @param existingIds - Array of existing bill IDs to avoid conflicts
   */
  static generateBillId(existingIds: string[] = [], hospitalId?: string): string {
    // Two ID schemes live in billing.json:
    //   flat          BILL-0088       — produced by this generator
    //   per-hospital  BILL-H001-001   — produced by the comprehensive seed
    // Matching only the flat form meant that against seeded data nothing ever
    // parsed, the max was always 0, and every bill came out as BILL-0001.
    // Parse the scheme the caller is actually working in, and emit the same one.
    if (hospitalId) {
      const prefix = `BILL-${hospitalId}-`;
      const next = this.maxSequence(existingIds, id =>
        id.startsWith(prefix) ? id.slice(prefix.length) : null,
      ) + 1;
      return `${prefix}${next.toString().padStart(3, '0')}`;
    }

    const next = this.maxSequence(existingIds, id => {
      const match = /^BILL-(\d+)$/.exec(id);
      return match ? match[1] : null;
    }) + 1;
    // Pad to 4 digits to match existing format like BILL-0088
    return `BILL-${next.toString().padStart(4, '0')}`;
  }

  /**
   * Highest numeric suffix among IDs the extractor recognises, or 0 when none
   * match. `extract` returns the digits of an ID, or null if it belongs to a
   * different scheme.
   */
  private static maxSequence(ids: string[], extract: (id: string) => string | null): number {
    const numbers = ids
      .map(id => extract(id))
      .map(digits => (digits === null ? NaN : parseInt(digits, 10)))
      .filter(num => Number.isFinite(num) && num > 0);
    return numbers.length > 0 ? Math.max(...numbers) : 0;
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

  /**
   * Generate audit log ID
   */
  static generateAuditId(): string {
    return this.generate('AUD-');
  }

  /**
   * Generate hospital ID with sequential pattern (H001, H002, etc.)
   * This maintains consistency with existing hospital IDs
   * @param existingIds - Array of existing hospital IDs to avoid conflicts
   */
  static generateHospitalId(existingIds: string[] = []): string {
    // Extract numeric parts from existing IDs (H001 -> 1, H010 -> 10, HSP001 -> 1, etc.)
    const numericIds = existingIds
      .map(id => {
        // Match both H001 and HSP001 patterns
        const match = id.match(/^H(?:SP)?(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);

    // Find the highest existing ID
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
    
    // Generate the next sequential ID
    const nextId = maxId + 1;
    return `H${nextId.toString().padStart(3, '0')}`;
  }
}

