"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStore = void 0;
const fs = require("fs");
const path = require("path");
class FileStore {
    constructor(fileName, seed) {
        this.seed = seed;
        this.filePath = path.join(process.cwd(), 'data', fileName);
    }
    load() {
        try {
            if (!fs.existsSync(this.filePath)) {
                const initial = this.seed();
                this.save(initial);
                return initial;
            }
            return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
        }
        catch {
            return this.seed();
        }
    }
    save(items) {
        try {
            fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
            fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
        }
        catch (err) {
            console.error(`Failed to persist ${this.filePath}:`, err);
        }
    }
}
exports.FileStore = FileStore;
//# sourceMappingURL=file-store.util.js.map