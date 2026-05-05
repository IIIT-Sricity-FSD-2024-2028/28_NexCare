export declare class DataSanitizer {
    static removePassword<T extends {
        password: string;
    }>(user: T): Omit<T, 'password'>;
    static removePasswords<T extends {
        password: string;
    }>(users: T[]): Omit<T, 'password'>[];
    static sanitizeUser<T extends {
        password: string;
    }>(user: T): Omit<T, 'password'>;
    static sanitizeUsers<T extends {
        password: string;
    }>(users: T[]): Omit<T, 'password'>[];
    static removeSensitiveFields<T>(data: T, sensitiveFields: (keyof T)[]): Omit<T, typeof sensitiveFields[number]>;
    static removeSensitiveFieldsFromArray<T>(dataArray: T[], sensitiveFields: (keyof T)[]): Omit<T, typeof sensitiveFields[number]>[];
}
