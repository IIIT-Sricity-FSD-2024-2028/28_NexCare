"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileLogger = exports.FileLogger = void 0;
const fs = require("fs");
const path = require("path");
const LOG_STREAMS = ['access', 'error', 'app'];
class FileLogger {
    constructor() {
        this.flushIntervalMs = Number(process.env.LOG_FLUSH_INTERVAL_MS) || 5000;
        this.maxBufferedEntries = 200;
        this.maxFileBytes = 5 * 1024 * 1024;
        this.logDir = path.join(process.cwd(), 'logs');
        this.buffers = { access: [], error: [], app: [] };
        this.timer = null;
        fs.mkdirSync(this.logDir, { recursive: true });
        this.start();
    }
    static getInstance() {
        if (!FileLogger.instance) {
            FileLogger.instance = new FileLogger();
        }
        return FileLogger.instance;
    }
    start() {
        if (this.timer)
            return;
        this.timer = setInterval(() => this.flush(), this.flushIntervalMs);
        this.timer.unref?.();
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.flush();
    }
    write(stream, level, message, meta = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...meta,
        };
        this.buffers[stream].push(JSON.stringify(entry));
        if (stream === 'error' || this.buffers[stream].length >= this.maxBufferedEntries) {
            this.flush(stream);
        }
    }
    info(stream, message, meta) {
        this.write(stream, 'info', message, meta);
    }
    warn(stream, message, meta) {
        this.write(stream, 'warn', message, meta);
    }
    error(message, meta) {
        this.write('error', 'error', message, meta);
    }
    flush(only) {
        const streams = only ? [only] : LOG_STREAMS;
        for (const stream of streams) {
            const pending = this.buffers[stream];
            if (pending.length === 0)
                continue;
            this.buffers[stream] = [];
            const payload = pending.join('\n') + '\n';
            try {
                const file = this.currentFile(stream);
                this.rotateIfLarge(file);
                fs.appendFileSync(file, payload, 'utf-8');
            }
            catch (err) {
                console.error(`[FileLogger] failed to write ${stream} log:`, err);
            }
        }
    }
    currentFile(stream) {
        const day = new Date().toISOString().slice(0, 10);
        return path.join(this.logDir, `${stream}-${day}.log`);
    }
    rotateIfLarge(file) {
        try {
            const stats = fs.statSync(file, { throwIfNoEntry: false });
            if (stats && stats.size >= this.maxFileBytes) {
                const stamp = new Date().toISOString().replace(/[:.]/g, '-');
                fs.renameSync(file, `${file}.${stamp}`);
            }
        }
        catch {
        }
    }
    readRecent(stream, limit = 100) {
        this.flush(stream);
        const file = this.currentFile(stream);
        if (!fs.existsSync(file))
            return [];
        const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(Boolean);
        return lines
            .slice(-limit)
            .reverse()
            .map((line) => {
            try {
                return JSON.parse(line);
            }
            catch {
                return { timestamp: '', level: 'info', message: line };
            }
        });
    }
    listFiles() {
        if (!fs.existsSync(this.logDir))
            return [];
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
exports.FileLogger = FileLogger;
exports.fileLogger = FileLogger.getInstance();
//# sourceMappingURL=file-logger.js.map