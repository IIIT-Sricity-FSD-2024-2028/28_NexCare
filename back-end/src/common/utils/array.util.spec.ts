import { ArrayUtil } from './array.util';

describe('ArrayUtil', () => {
  it('finds an item by id', () => {
    const items = [{ id: 'a', v: 1 }, { id: 'b', v: 2 }];
    expect(ArrayUtil.findById(items, 'b')?.v).toBe(2);
    expect(ArrayUtil.findById(items, 'z')).toBeUndefined();
  });

  it('reports existence by id', () => {
    const items = [{ id: 'a' }];
    expect(ArrayUtil.existsById(items, 'a')).toBe(true);
    expect(ArrayUtil.existsById(items, 'z')).toBe(false);
  });

  it('updates an item in place', () => {
    const items = [{ id: 'a', v: 1 }];
    const updated = ArrayUtil.updateById(items, 'a', { v: 9 });
    expect(updated?.v).toBe(9);
    expect(items[0].v).toBe(9);
  });

  it('removes an item by id', () => {
    const items = [{ id: 'a' }, { id: 'b' }];
    expect(ArrayUtil.removeById(items, 'a')).toBe(true);
    expect(items).toHaveLength(1);
    expect(ArrayUtil.removeById(items, 'zz')).toBe(false);
  });
});
