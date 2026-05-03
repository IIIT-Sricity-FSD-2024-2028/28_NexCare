import { ApiResponse } from '../interfaces/api-response.interface';

/**
 * Utility class for creating standardized API responses
 * Ensures consistency across all backend endpoints
 */
export class ResponseUtil {
  /**
   * Create a successful response
   * @param message Success message
   * @param data Response data (optional)
   * @returns Standardized success response
   */
  static success<T>(message: string, data?: T): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create an error response
   * @param message Error message
   * @param data Error details (optional)
   * @returns Standardized error response
   */
  static error<T>(message: string, data?: T): ApiResponse<T> {
    return {
      success: false,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  
  /**
   * Handle not found error
   * @param resource Resource name
   * @param id Resource ID
   * @returns Standardized not found response
   */
  static notFound(resource: string, id?: string): ApiResponse {
    const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
    return this.error(message);
  }

  /**
   * Handle validation error
   * @param message Validation error message
   * @returns Standardized validation error response
   */
  static validationError(message: string): ApiResponse {
    return this.error(`Validation Error: ${message}`);
  }

  /**
   * Handle unauthorized access
   * @param message Unauthorized message (optional)
   * @returns Standardized unauthorized response
   */
  static unauthorized(message: string = 'Unauthorized access'): ApiResponse {
    return this.error(message);
  }

  /**
   * Handle forbidden access
   * @param message Forbidden message (optional)
   * @returns Standardized forbidden response
   */
  static forbidden(message: string = 'Forbidden access'): ApiResponse {
    return this.error(message);
  }

  /**
   * Handle server error
   * @param message Server error message (optional)
   * @returns Standardized server error response
   */
  static serverError(message: string = 'Internal server error'): ApiResponse {
    return this.error(message);
  }

  /**
   * Handle created resource response
   * @param resource Resource name
   * @param data Created resource data
   * @returns Standardized created response
   */
  static created<T>(resource: string, data: T): ApiResponse<T> {
    return this.success(`${resource} created successfully`, data);
  }

  /**
   * Handle updated resource response
   * @param resource Resource name
   * @param data Updated resource data
   * @returns Standardized updated response
   */
  static updated<T>(resource: string, data: T): ApiResponse<T> {
    return this.success(`${resource} updated successfully`, data);
  }

  /**
   * Handle deleted resource response
   * @param resource Resource name
   * @returns Standardized deleted response
   */
  static deleted(resource: string): ApiResponse {
    return this.success(`${resource} deleted successfully`);
  }
}
