import { writeFile } from "fs/promises";

export default class JSONConverter {
  /**
   * Convert an array of JSON objects to a CSV string
   * @param {Array<Object>} jsonData - Array of JSON objects
   * @param {string} delimiter - CSV delimiter (default is ',')
   * @returns {string} - CSV-formatted string
   */
  static toCSV(jsonData, delimiter = ",") {
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      throw new Error("Invalid or empty JSON array");
    }

    const headers = Object.keys(jsonData[0]);
    const csvRows = [headers.join(delimiter)];

    for (const row of jsonData) {
      const values = headers.map((key) => {
        const value = row[key] ?? "";
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(delimiter));
    }

    return csvRows.join("\n");
  }

  /**
   * Write the CSV string to a file
   * @param {Array<Object>} jsonData
   * @param {string} filePath
   * @param {string} delimiter
   */
  static async saveCSVToFile(jsonData, filePath, delimiter = ",") {
    const csv = this.toCSV(jsonData, delimiter);
    await writeFile(filePath, csv, "utf8");
    console.log(`✅ CSV saved to ${filePath}`);
  }
}

/*
```
import { JSONConverter } from './jsonConverter.mjs';

const sampleData = [
  { name: 'Alice', age: 30, city: 'NY' },
  { name: 'Bob', age: 25, city: 'LA' }
];

const csv = JSONConverter.toCSV(sampleData);
console.log(csv);

// Save to file
await JSONConverter.saveCSVToFile(sampleData, './output.csv');
```
*/
