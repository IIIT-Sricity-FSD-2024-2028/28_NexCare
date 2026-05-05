"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayUtil = void 0;
class ArrayUtil {
    static findById(items, id) {
        return items.find(item => item.id === id);
    }
    static findIndexById(items, id) {
        return items.findIndex(item => item.id === id);
    }
    static removeById(items, id) {
        const index = this.findIndexById(items, id);
        if (index !== -1) {
            items.splice(index, 1);
            return true;
        }
        return false;
    }
    static updateById(items, id, updates) {
        const index = this.findIndexById(items, id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            return items[index];
        }
        return undefined;
    }
    static existsById(items, id) {
        return this.findIndexById(items, id) !== -1;
    }
    static filterByProperty(items, property, value) {
        return items.filter(item => item[property] === value);
    }
    static searchByText(items, query, properties) {
        const lowerQuery = query.toLowerCase();
        return items.filter(item => properties.some(prop => String(item[prop]).toLowerCase().includes(lowerQuery)));
    }
}
exports.ArrayUtil = ArrayUtil;
//# sourceMappingURL=array.util.js.map