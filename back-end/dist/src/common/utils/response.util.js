"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseUtil = void 0;
class ResponseUtil {
    static success(message, data) {
        return {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        };
    }
    static error(message, data) {
        return {
            success: false,
            message,
            data,
            timestamp: new Date().toISOString()
        };
    }
    static notFound(resource, id) {
        const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
        return this.error(message);
    }
    static validationError(message) {
        return this.error(`Validation Error: ${message}`);
    }
    static unauthorized(message = 'Unauthorized access') {
        return this.error(message);
    }
    static forbidden(message = 'Forbidden access') {
        return this.error(message);
    }
    static serverError(message = 'Internal server error') {
        return this.error(message);
    }
    static created(resource, data) {
        return this.success(this.phrase(resource, 'created'), data);
    }
    static updated(resource, data) {
        return this.success(this.phrase(resource, 'updated'), data);
    }
    static deleted(resource) {
        return this.success(this.phrase(resource, 'deleted'));
    }
    static phrase(resource, verb) {
        return /successfully\s*$/i.test(resource)
            ? resource
            : `${resource} ${verb} successfully`;
    }
}
exports.ResponseUtil = ResponseUtil;
//# sourceMappingURL=response.util.js.map