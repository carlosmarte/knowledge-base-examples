#!/usr/bin/env node

import fs from "fs";
import readline from "readline";
import path from "path";
import { parse } from "csv-parse";

const [, , csvFilePath, columnName] = process.argv;

if (!csvFilePath || !columnName) {
  console.error("Usage: node extract-column-cli.js <csvFilePath> <columnName>");
  process.exit(1);
}

const fullPath = path.resolve(process.cwd(), csvFilePath);

const columnValues = [];

fs.createReadStream(fullPath)
  .pipe(parse({ columns: true, trim: true }))
  .on("data", (row) => {
    if (columnName in row) {
      columnValues.push(row[columnName]);
    }
  })
  .on("end", () => {
    console.log(JSON.stringify(columnValues, null, 2));
  })
  .on("error", (err) => {
    console.error("Error reading or parsing CSV:", err.message);
    process.exit(1);
  });

/*
```
npm install csv-parse
node extract-column-cli.js sample.csv email
```
*/
