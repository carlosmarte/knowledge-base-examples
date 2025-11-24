#!/usr/bin/env node

import inquirer from "inquirer";
import { getTableMetadata } from "./metadata-extractor.mjs";
import fs from "fs";

const runCLI = async () => {
  //sequelize
  try {
    const { tableName } = await inquirer.prompt([
      {
        type: "input",
        name: "tableName",
        message: "Enter the name of the table to inspect:",
      },
    ]);

    await sequelize.authenticate();
    console.log(`🔍 Connected. Fetching metadata for table: ${tableName}...`);

    const metadata = await getTableMetadata(tableName);

    const filename = `metadata-${tableName}.json`;
    fs.writeFileSync(filename, JSON.stringify(metadata, null, 2));
    console.log(`✅ Metadata saved to ${filename}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  } finally {
    await sequelize.close();
  }
};

runCLI();
