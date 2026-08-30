import { IdGenerator } from './id-generator.util';

describe('IdGenerator', () => {
  it('applies the given prefix', () => {
    expect(IdGenerator.generate('APT-').startsWith('APT-')).toBe(true);
  });

  it('produces unique ids under a tight burst (no collisions)', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 20000; i++) {
      ids.add(IdGenerator.generate('P'));
    }
    // Every generated id must be unique — regression guard for F6.
    expect(ids.size).toBe(20000);
  });

  it('typed helpers carry their prefixes', () => {
    expect(IdGenerator.generateUserId().startsWith('U')).toBe(true);
    expect(IdGenerator.generateBillId().startsWith('BILL-')).toBe(true);
  });
});
