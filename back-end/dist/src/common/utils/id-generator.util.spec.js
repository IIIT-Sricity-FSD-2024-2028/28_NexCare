"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const id_generator_util_1 = require("./id-generator.util");
describe('IdGenerator', () => {
    it('applies the given prefix', () => {
        expect(id_generator_util_1.IdGenerator.generate('APT-').startsWith('APT-')).toBe(true);
    });
    it('produces unique ids under a tight burst (no collisions)', () => {
        const ids = new Set();
        for (let i = 0; i < 20000; i++) {
            ids.add(id_generator_util_1.IdGenerator.generate('P'));
        }
        expect(ids.size).toBe(20000);
    });
    it('typed helpers carry their prefixes', () => {
        expect(id_generator_util_1.IdGenerator.generateUserId().startsWith('U')).toBe(true);
        expect(id_generator_util_1.IdGenerator.generateBillId().startsWith('BILL-')).toBe(true);
    });
});
//# sourceMappingURL=id-generator.util.spec.js.map