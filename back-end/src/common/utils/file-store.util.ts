import * as fs from 'fs';
import * as path from 'path';

/**
 * FileStore
 * Tiny JSON-file persistence helper so services survive restarts.
 * Mirrors the load/save pattern already used by patients/appointments/billing.
 *
 * Usage:
 *   private readonly store = new FileStore<Bed>('beds.json', () => SEED);
 *   const beds = this.store.load();
 *   ...mutate...
 *   this.store.save(beds);
 */
export class FileStore<T> {
  private readonly filePath: string;

  constructor(fileName: string, private readonly seed: () => T[], private readonly strictWrites = false) {
    this.filePath = path.join(process.cwd(), 'data', fileName);
  }

  /** Load items from disk, seeding the file on first access. */
  load(): T[] {
    try {
      if (!fs.existsSync(this.filePath)) {
        const initial = this.seed();
        this.save(initial);
        return initial;
      }
      return JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) as T[];
    } catch {
      return this.seed();
    }
  }

  /** Persist the full array to disk. */
  save(items: T[]): void {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      const target = this.strictWrites ? this.filePath + '.tmp' : this.filePath;
      fs.writeFileSync(target, JSON.stringify(items, null, 2), 'utf-8');
      if (this.strictWrites) fs.renameSync(target, this.filePath);
    } catch (err) {
      if (this.strictWrites) throw err;
      console.error(`Failed to persist ${this.filePath}:`, err);
    }
  }
}

export { FileStore as FileStoreUtil };
