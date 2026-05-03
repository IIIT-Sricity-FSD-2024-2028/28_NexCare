/**
 * Data Sanitizer Utility
 * Eliminates duplicate data sanitization patterns across services
 */

export class DataSanitizer {
  /**
   * Remove password from user object
   * @param user - User object with password property
   * @returns User object without password
   */
  static removePassword<T extends { password: string }>(user: T): Omit<T, 'password'> {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Remove passwords from array of users
   * @param users - Array of user objects with password property
   * @returns Array of user objects without passwords
   */
  static removePasswords<T extends { password: string }>(users: T[]): Omit<T, 'password'>[] {
    return users.map(user => this.removePassword(user));
  }

  /**
   * Sanitize user data for API response
   * @param user - User object
   * @returns Sanitized user object safe for API response
   */
  static sanitizeUser<T extends { password: string }>(user: T): Omit<T, 'password'> {
    return this.removePassword(user);
  }

  /**
   * Sanitize array of users for API response
   * @param users - Array of user objects
   * @returns Array of sanitized user objects safe for API response
   */
  static sanitizeUsers<T extends { password: string }>(users: T[]): Omit<T, 'password'>[] {
    return this.removePasswords(users);
  }

  /**
   * Remove sensitive fields from object
   * @param data - Object to sanitize
   * @param sensitiveFields - Array of field names to remove
   * @returns Sanitized object
   */
  static removeSensitiveFields<T>(data: T, sensitiveFields: (keyof T)[]): Omit<T, typeof sensitiveFields[number]> {
    const sanitized = { ...data };
    sensitiveFields.forEach(field => {
      delete sanitized[field];
    });
    return sanitized as Omit<T, typeof sensitiveFields[number]>;
  }

  /**
   * Remove sensitive fields from array of objects
   * @param dataArray - Array of objects to sanitize
   * @param sensitiveFields - Array of field names to remove
   * @returns Array of sanitized objects
   */
  static removeSensitiveFieldsFromArray<T>(dataArray: T[], sensitiveFields: (keyof T)[]): Omit<T, typeof sensitiveFields[number]>[] {
    return dataArray.map(item => this.removeSensitiveFields(item, sensitiveFields));
  }
}
