import { ApiResponse } from '../interfaces/api-response.interface';
export declare class ResponseUtil {
    static success<T>(message: string, data?: T): ApiResponse<T>;
    static error<T>(message: string, data?: T): ApiResponse<T>;
    static notFound(resource: string, id?: string): ApiResponse;
    static validationError(message: string): ApiResponse;
    static unauthorized(message?: string): ApiResponse;
    static forbidden(message?: string): ApiResponse;
    static serverError(message?: string): ApiResponse;
    static created<T>(resource: string, data: T): ApiResponse<T>;
    static updated<T>(resource: string, data: T): ApiResponse<T>;
    static deleted(resource: string): ApiResponse;
}
