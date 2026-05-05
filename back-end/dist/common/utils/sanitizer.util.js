"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSanitizer = void 0;
class DataSanitizer {
    static removePassword(user) {
        const { password, ...sanitized } = user;
        return sanitized;
    }
    static removePasswords(users) {
        return users.map(user => this.removePassword(user));
    }
    static sanitizeUser(user) {
        return this.removePassword(user);
    }
    static sanitizeUsers(users) {
        return this.removePasswords(users);
    }
    static removeSensitiveFields(data, sensitiveFields) {
        const sanitized = { ...data };
        sensitiveFields.forEach(field => {
            delete sanitized[field];
        });
        return sanitized;
    }
    static removeSensitiveFieldsFromArray(dataArray, sensitiveFields) {
        return dataArray.map(item => this.removeSensitiveFields(item, sensitiveFields));
    }
}
exports.DataSanitizer = DataSanitizer;
//# sourceMappingURL=sanitizer.util.js.map