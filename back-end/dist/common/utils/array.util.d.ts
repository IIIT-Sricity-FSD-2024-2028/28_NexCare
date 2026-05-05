export declare class ArrayUtil {
    static findById<T extends {
        id: string;
    }>(items: T[], id: string): T | undefined;
    static findIndexById<T extends {
        id: string;
    }>(items: T[], id: string): number;
    static removeById<T extends {
        id: string;
    }>(items: T[], id: string): boolean;
    static updateById<T extends {
        id: string;
    }>(items: T[], id: string, updates: Partial<T>): T | undefined;
    static existsById<T extends {
        id: string;
    }>(items: T[], id: string): boolean;
    static filterByProperty<T>(items: T[], property: keyof T, value: any): T[];
    static searchByText<T>(items: T[], query: string, properties: (keyof T)[]): T[];
}
