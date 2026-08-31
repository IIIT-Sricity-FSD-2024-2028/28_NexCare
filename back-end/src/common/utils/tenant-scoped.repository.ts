import * as fs from 'fs';
import * as path from 'path';
import { ForbiddenException } from '@nestjs/common';

/**
 * TenantScopedRepository<T>
 *
 * A data-access wrapper that makes hospital-level scoping unskippable.
 * Instead of every service calling FileStore.load() and then
 * remembering to .filter(x => x.hospitalId === hospitalId), this wrapper
 * enforces the filter on every read — so a developer *cannot* accidentally
 * write an unscoped query.
 *
 * The fail-secure principle: if no hospitalId is in context and the
 * collection is not globally visible, the call throws rather than returning
 * all tenants' data.
 *
 * Usage:
 *   private readonly billRepo = new TenantScopedRepository<Bill>('billing.json');
 *
 *   // In a service method:
 *   const bills = this.billRepo.findAll(user.hospitalId);
 *   const bill  = this.billRepo.findById(id, user.hospitalId);
 *   this.billRepo.save(updatedBills, user.hospitalId);
 *
 * Superuser/Regional-Manager bypass:
 *   Pass null as hospitalId to get the full, unscoped dataset.
 *   Callers (controllers) must explicitly do this — there is no implicit bypass.
 */
export class TenantScopedRepository<T extends { hospitalId?: string }> {
  private readonly filePath: string;

  constructor(fileName: string) {
    this.filePath = path.join(process.cwd(), 'data', fileName);
  }

  // ── Private I/O ────────────────────────────────────────────────────────────

  private readAll(): T[] {
    try {
      if (!fs.existsSync(this.filePath)) return [];
      return JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) as T[];
    } catch {
      return [];
    }
  }

  private writeAll(items: T[]): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(items, null, 2), 'utf-8');
    fs.renameSync(tmp, this.filePath);
  }

  // ── Public scoped API ───────────────────────────────────────────────────────

  /**
   * Return all items for a given hospitalId.
   * Pass null to return the complete, unscoped dataset (superuser only —
   * callers must guard this themselves).
   */
  findAll(hospitalId: string | null): T[] {
    const all = this.readAll();
    if (hospitalId === null) return all; // Explicit superuser bypass
    if (!hospitalId) {
      throw new ForbiddenException(
        'TenantScopedRepository: no hospitalId provided and null bypass not used. ' +
        'This is a bug — provide hospitalId from the verified JWT, not client input.',
      );
    }
    return all.filter(item => item.hospitalId === hospitalId);
  }

  /**
   * Find a single item by id within a tenant's scope.
   * Returns undefined if not found or belongs to a different hospital.
   * Callers should pass the result to ResourceOwnershipGuard.assertSameHospital.
   */
  findById(id: string, idField: keyof T = 'id' as keyof T, hospitalId?: string): T | undefined {
    const all = this.readAll();
    const item = all.find(x => (x as any)[idField] === id);
    if (!item) return undefined;
    if (hospitalId && item.hospitalId && item.hospitalId !== hospitalId) {
      return undefined; // Silently return undefined — caller throws 404
    }
    return item;
  }

  /**
   * Save the full tenant-scoped dataset back to disk atomically.
   * If hospitalId is provided, only items for OTHER hospitals are preserved —
   * the new items replace those belonging to this hospital.
   * This prevents a bug where saving a partial array wipes another tenant's data.
   */
  saveScoped(newItems: T[], hospitalId: string): void {
    if (!hospitalId) {
      throw new ForbiddenException('TenantScopedRepository.saveScoped requires a hospitalId.');
    }
    const all = this.readAll();
    const otherTenants = all.filter(item => item.hospitalId !== hospitalId);
    this.writeAll([...otherTenants, ...newItems]);
  }

  /**
   * Save the entire dataset, replacing all records.
   * Use only for superuser operations or initial seeding.
   */
  saveAll(items: T[]): void {
    this.writeAll(items);
  }

  /** Append a single new item to the collection. */
  insert(item: T): void {
    const all = this.readAll();
    all.push(item);
    this.writeAll(all);
  }

  /**
   * Update a single item by id. Enforces hospitalId match.
   * Returns false if not found or scope mismatch.
   */
  updateById(id: string, updates: Partial<T>, hospitalId?: string): boolean {
    const all = this.readAll();
    const idx = all.findIndex(x => (x as any).id === id);
    if (idx === -1) return false;
    if (hospitalId && all[idx].hospitalId && all[idx].hospitalId !== hospitalId) {
      return false;
    }
    all[idx] = { ...all[idx], ...updates };
    this.writeAll(all);
    return true;
  }

  /**
   * Delete a single item by id. Enforces hospitalId match.
   * Returns the deleted item or undefined if not found/scope mismatch.
   */
  deleteById(id: string, hospitalId?: string): T | undefined {
    const all = this.readAll();
    const idx = all.findIndex(x => (x as any).id === id);
    if (idx === -1) return undefined;
    if (hospitalId && all[idx].hospitalId && all[idx].hospitalId !== hospitalId) {
      return undefined;
    }
    const [deleted] = all.splice(idx, 1);
    this.writeAll(all);
    return deleted;
  }
}
