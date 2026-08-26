export declare class FileStore<T> {
    private readonly seed;
    private readonly filePath;
    constructor(fileName: string, seed: () => T[]);
    load(): T[];
    save(items: T[]): void;
}
