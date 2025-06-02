#!/usr/bin/env node

import fetch from "node-fetch";
import { program } from "commander";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import readline from "readline";

const GITHUB_API = "https://api.github.com/search/code";
const FILENAME = "apps.yaml";

const HEADERS = (token) => ({
  Accept: "application/vnd.github.v3+json",
  Authorization: `Bearer ${token}`,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

function hasNestedKey(obj, keyPath) {
  const keys = keyPath.split(".");
  return keys.reduce((o, k) => (o || {})[k], obj) !== undefined;
}

async function fetchYAMLContent(apiUrl, token, default_branch) {
  const rawUrl =
    apiUrl.replace("/search/code", "/repos") + `?ref=${default_branch}`;
  const res = await fetch(rawUrl, { headers: HEADERS(token) });
  const json = await res.json();
  const rawContent = Buffer.from(json.content, "base64").toString("utf-8");
  return rawContent;
}

export async function run({ token, key, outputFile }) {
  const resolvedPath = path.resolve(outputFile);
  const writeHeaders = !fs.existsSync(resolvedPath);
  const writeStream = fs.createWriteStream(resolvedPath, { flags: "a" });

  if (writeHeaders) {
    writeStream.write("repo,file_url,key_found\n");
  }

  let page = 1;
  let resultCount = 0;
  let morePages = true;

  console.log(
    `🔍 Searching GitHub for '${FILENAME}.yaml' files with key '${key}'...`
  );

  while (morePages) {
    const searchUrl = `${GITHUB_API}?q=filename:${FILENAME}.yaml&per_page=10&page=${page}`;
    const response = await fetch(searchUrl, { headers: HEADERS(token) });
    const data = await response.json();

    if (!data.items || !Array.isArray(data.items)) {
      console.error(`❌ GitHub API Error: ${data.message || "Unknown error"}`);
      break;
    }

    for (const item of data.items) {
      try {
        const content = await fetchYAMLContent(
          item.url,
          token,
          item.repository.default_branch
        );
        const parsed = yaml.load(content);

        if (hasNestedKey(parsed, key)) {
          const record = `"${item.repository.full_name}","${item.html_url}","${key}"\n`;
          writeStream.write(record);
          console.log(`✅ Match: ${item.repository.full_name} (${key})`);
          resultCount++;
        }
      } catch (err) {
        console.warn(
          `⚠️  Could not parse: ${item.repository.full_name}/${item.path}`
        );
      }
    }

    // Pagination
    const linkHeader = response.headers.get("link");
    morePages = linkHeader && linkHeader.includes('rel="next"');
    if (morePages) {
      page++;
      await sleep(2000); // delay between pages
    }
  }

  writeStream.end();
  console.log(`\n🎉 Done. Found ${resultCount} matches.`);
  console.log(`💾 Results saved to ${resolvedPath}`);
}

// If called from CLI
if (process.argv[1] === url.fileURLToPath(import.meta.url)) {
  program
    .requiredOption("-t, --token <token>", "GitHub personal access token")
    .requiredOption("-k, --key <key>", "YAML key to search for (e.g., app.id)")
    .parse();

  const { token, key } = program.opts();

  (async () => {
    const outputFile = await askQuestion(
      "📁 Enter CSV path to save results (e.g., ./results.csv): "
    );
    await run({ token, key, outputFile });
  })();
}
