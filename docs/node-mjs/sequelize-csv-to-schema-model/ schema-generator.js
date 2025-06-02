#!/usr/bin/env node

import fs from "fs";
import readline from "readline";
import path from "path";
import { parse } from "csv-parse/sync";

/**
 * Prompt user for file input
 */
async function promptForCSVPath() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query) =>
    new Promise((resolve) => rl.question(query, resolve));
  const filePath = await question("Enter path to CSV file: ");
  rl.close();
  return filePath.trim();
}

/**
 * Infer Sequelize type from CSV value
 */
function inferSequelizeType(value) {
  if (!value) return "STRING";

  const num = Number(value);
  if (!isNaN(num)) return Number.isInteger(num) ? "INTEGER" : "FLOAT";
  if (value.toLowerCase() === "true" || value.toLowerCase() === "false")
    return "BOOLEAN";
  if (!isNaN(Date.parse(value))) return "DATE";
  return "STRING";
}

/**
 * Generate Sequelize model definition
 */
function generateSequelizeModelDefinition(name, headers, row) {
  const fields = headers.map((header) => {
    const type = inferSequelizeType(row[header]);
    return `    ${header}: {\n      type: DataTypes.${type}\n    }`;
  });

  return `// models/${name}.js
import { DataTypes } from 'sequelize';
import sequelize from '../sequelize.js'; // Assumes an existing Sequelize instance

const ${name} = sequelize.define('${name}', {
${fields.join(",\n")}
}, {
  timestamps: false
});

export default ${name};
`;
}

/**
 * Main runner
 */
async function run() {
  const filePath = await promptForCSVPath();
  if (!fs.existsSync(filePath)) {
    console.error(`File does not exist: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const records = parse(content, { columns: true, skip_empty_lines: true });

  if (!records.length) {
    console.error("CSV contains no data");
    process.exit(1);
  }

  const headers = Object.keys(records[0]);
  const modelCode = generateSequelizeModelDefinition(
    "GeneratedModel",
    headers,
    records[0]
  );

  fs.mkdirSync("./models", { recursive: true });
  fs.writeFileSync("./models/GeneratedModel.js", modelCode);
  console.log("✅ Sequelize model created at ./models/GeneratedModel.js");
}

run();
