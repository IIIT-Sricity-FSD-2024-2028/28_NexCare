import * as fs from 'fs';
import * as path from 'path';

/**
 * Log streams written by the application.
 *  access — one entry per HTTP request/response
 *  error  — every 4xx/5xx response and every thrown exception
 *  app    — application lifecycle and business events
 */
export type LogStream = 'access' | 'error' | 'app';

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

const LOG_STREAMS: LogStream[] = ['access', 'error', 'app'];

/**
 * FileLogger
 *
 * Buffers log entries in memory and flushes them to disk on a timer, so a
 * burst of requests costs one write instead of one write per request. Entries
 * are stored as JSON lines, one object per line, which keeps them greppable
 * and machine readable for the log viewer endpoint.
 *
 * Files live in back-end/logs and are rotated:
 *  - by day  — logs/access-2026-08-26.log
 *  - by size — a file over MAX_FILE_BYTES is renamed with a timestamp suffix
 *
 * Implemented as a singleton rather than a Nest provider because it is also
 * needed from places Nest cannot inject into: the global exception filter and
 * the Express-level error handler in main.ts.
 */
export class FileLogger {
  private static instance: FileLogger;

  /** How often buffered entries are written to disk */
  private readonly flushIntervalMs = Number(process.env.LOG_FLUSH_INTERVAL_MS) || 5000;

  /** Flush early if a stream buffers this many entries before the timer fires */
  private readonly maxBufferedEntries = 200;

  /** Rotate a log file once it grows past this size */
  private readonly maxFileBytes = 5 * 1024 * 1024;

  private readonly logDir = path.join(process.cwd(), 'logs');
  private readonly buffers: Record<LogStream, string[]> = { access: [], error: [], app: [] };
  private timer: NodeJS.Timeout | null = null;

  private constructor() {
    fs.mkdirSync(this.logDir, { recursive: true });
    this.start();
  }

  static getInstance(): FileLogger {
    if (!FileLogger.instance) {
      FileLogger.instance = new FileLogger();
    }
    return FileLogger.instance;
  }

  /** Begin the periodic flush. unref() keeps the timer from holding the process open. */
  private start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.flush(), this.flushIntervalMs);
    this.timer.unref?.();
  }

  /** Stop the timer and write out whatever is still buffered (shutdown path) */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush();
  }

  /** Queue an entry. Nothing touches the disk until the next flush. */
  write(stream: LogStream, level: LogLevel, message: string, meta: Record<string, unknown> = {}): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };

    this.buffers[stream].push(JSON.stringify(entry));

    // Errors and full buffers are written immediately — an error that only
    // reaches disk five seconds later is an error lost to a crash.
    if (stream === 'error' || this.buffers[stream].length >= this.maxBufferedEntries) {
      this.flush(stream);
    }
  }

  info(stream: LogStream, message: string, meta?: Record<string, unknown>): void {
    this.write(stream, 'info', message, meta);
  }

  warn(stream: LogStream, message: string, meta?: Record<string, unknown>): void {
    this.write(stream, 'warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.write('error', 'error', message, meta);
  }

  /** Write buffered entries for one stream, or for all of them */
  flush(only?: LogStream): void {
    const streams = only ? [only] : LOG_STREAMS;

    for (const stream of streams) {
      const pending = this.buffers[stream];
      if (pending.length === 0) continue;

      // Swap the buffer out first so entries logged during the write are kept
      this.buffers[stream] = [];
      const payload = pending.join('\n') + '\n';

      try {
        const file = this.currentFile(stream);
        this.rotateIfLarge(file);
        fs.appendFileSync(file, payload, 'utf-8');
      } catch (err) {
        // Never let logging break a request — fall back to the console
        console.error(`[FileLogger] failed to write ${stream} log:`, err);
      }
    }
  }

  /** logs/<stream>-YYYY-MM-DD.log */
  private currentFile(stream: LogStream): string {
    const day = new Date().toISOString().slice(0, 10);
    return path.join(this.logDir, `${stream}-${day}.log`);
  }

  private rotateIfLarge(file: string): void {
    try {
      const stats = fs.statSync(file, { throwIfNoEntry: false } as any);
      if (stats && stats.size >= this.maxFileBytes) {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        fs.renameSync(file, `${file}.${stamp}`);
      }
    } catch {
      // File does not exist yet — appendFileSync will create it
    }
  }

  /**
   * Most recent entries from a stream, newest first.
   * Flushes first so a caller always sees everything logged so far.
   */
  readRecent(stream: LogStream, limit = 100): LogEntry[] {
    this.flush(stream);

    const file = this.currentFile(stream);
    if (!fs.existsSync(file)) return [];

    const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(Boolean);
    return lines
      .slice(-limit)
      .reverse()
      .map((line) => {
        try {
          return JSON.parse(line) as LogEntry;
        } catch {
          return { timestamp: '', level: 'info' as LogLevel, message: line };
        }
      });
  }

  /** Log files currently on disk, with sizes — used by the log viewer */
  listFiles(): Array<{ name: string; sizeBytes: number; modifiedAt: string }> {
    if (!fs.existsSync(this.logDir)) return [];

    return fs
      .readdirSync(this.logDir)
      .filter((name) => name.includes('.log'))
      .map((name) => {
        const stats = fs.statSync(path.join(this.logDir, name));
        return { name, sizeBytes: stats.size, modifiedAt: stats.mtime.toISOString() };
      })
      .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  }
}

/** Shared instance used across middleware, filters and services */
export const fileLogger = FileLogger.getInstance();
