export type LogStream = 'access' | 'error' | 'app';
export type LogLevel = 'info' | 'warn' | 'error';
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    [key: string]: unknown;
}
export declare class FileLogger {
    private static instance;
    private readonly flushIntervalMs;
    private readonly maxBufferedEntries;
    private readonly maxFileBytes;
    private readonly logDir;
    private readonly buffers;
    private timer;
    private constructor();
    static getInstance(): FileLogger;
    private start;
    stop(): void;
    write(stream: LogStream, level: LogLevel, message: string, meta?: Record<string, unknown>): void;
    info(stream: LogStream, message: string, meta?: Record<string, unknown>): void;
    warn(stream: LogStream, message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
    flush(only?: LogStream): void;
    private currentFile;
    private rotateIfLarge;
    readRecent(stream: LogStream, limit?: number): LogEntry[];
    listFiles(): Array<{
        name: string;
        sizeBytes: number;
        modifiedAt: string;
    }>;
}
export declare const fileLogger: FileLogger;
