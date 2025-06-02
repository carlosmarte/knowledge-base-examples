const crypto = require("crypto");

class ObjectDeduplicator {
  /**
   * Recursively sort keys in object for stable hashing
   */
  static sortObjectKeys(obj) {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sortObjectKeys(item));
    } else if (obj !== null && typeof obj === "object") {
      return Object.keys(obj)
        .sort()
        .reduce((acc, key) => {
          acc[key] = this.sortObjectKeys(obj[key]);
          return acc;
        }, {});
    }
    return obj;
  }

  /**
   * Generate SHA-256 hash ID from sorted object
   */
  static generateHashId(obj) {
    const sorted = this.sortObjectKeys(obj);
    const jsonString = JSON.stringify(sorted);
    return crypto.createHash("sha256").update(jsonString).digest("hex");
  }

  /**
   * Remove duplicate objects based on content hash
   * @param {Array<Object>} inputArr
   * @returns {Array<Object>} Deduplicated array
   */
  static removeDuplicates(inputArr) {
    const seen = new Set();
    const result = [];

    for (const obj of inputArr) {
      const hash = this.generateHashId(obj);
      if (!seen.has(hash)) {
        seen.add(hash);
        result.push(obj);
      }
    }

    return result;
  }
}

/*```
const input = [
  { name: 'Alice', age: 30 },
  { age: 30, name: 'Alice' },
  { name: 'Bob', age: 25 },
  { age: 25, name: 'Bob' },
  { name: 'Alice', age: 30, extra: null },
];

const uniqueObjects = ObjectDeduplicator.removeDuplicates(input);
console.log(uniqueObjects);
```*/
