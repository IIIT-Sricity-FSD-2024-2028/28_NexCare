/**
 * Array Utility Functions
 * Eliminates duplicate array manipulation patterns across services
 */

export class ArrayUtil {
  /**
   * Find item by ID in an array
   * @param items - Array of items with 'id' property
   * @param id - ID to search for
   * @returns Found item or undefined
   */
  static findById<T extends { id: string }>(items: T[], id: string): T | undefined {
    return items.find(item => item.id === id);
  }

  /**
   * Find index of item by ID in an array
   * @param items - Array of items with 'id' property
   * @param id - ID to search for
   * @returns Index of found item or -1
   */
  static findIndexById<T extends { id: string }>(items: T[], id: string): number {
    return items.findIndex(item => item.id === id);
  }

  /**
   * Remove item by ID from array
   * @param items - Array of items with 'id' property
   * @param id - ID to remove
   * @returns True if item was removed, false if not found
   */
  static removeById<T extends { id: string }>(items: T[], id: string): boolean {
    const index = this.findIndexById(items, id);
    if (index !== -1) {
      items.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update item by ID in array
   * @param items - Array of items with 'id' property
   * @param id - ID to update
   * @param updates - Partial updates to apply
   * @returns Updated item or undefined if not found
   */
  static updateById<T extends { id: string }>(items: T[], id: string, updates: Partial<T>): T | undefined {
    const index = this.findIndexById(items, id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      return items[index];
    }
    return undefined;
  }

  /**
   * Check if item with ID exists in array
   * @param items - Array of items with 'id' property
   * @param id - ID to check
   * @returns True if item exists, false otherwise
   */
  static existsById<T extends { id: string }>(items: T[], id: string): boolean {
    return this.findIndexById(items, id) !== -1;
  }

  /**
   * Filter array by property value
   * @param items - Array of items
   * @param property - Property name to filter by
   * @param value - Value to match
   * @returns Filtered array
   */
  static filterByProperty<T>(items: T[], property: keyof T, value: any): T[] {
    return items.filter(item => item[property] === value);
  }

  /**
   * Search array by text in multiple properties
   * @param items - Array of items
   * @param query - Search query
   * @param properties - Properties to search in
   * @returns Filtered array matching query
   */
  static searchByText<T>(items: T[], query: string, properties: (keyof T)[]): T[] {
    const lowerQuery = query.toLowerCase();
    return items.filter(item => 
      properties.some(prop => 
        String(item[prop]).toLowerCase().includes(lowerQuery)
      )
    );
  }
}
