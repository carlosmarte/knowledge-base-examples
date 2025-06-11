import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

// Handle __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Input: Array of URLs
const urls = [
  'https://example.com',
  'https://playwright.dev/docs/intro',
  'https://github.com/microsoft/playwright',
];

// Ensure ./generated directory exists
const outputDir = path.resolve(__dirname, 'generated');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Utility to sanitize filename from URL
function getFilenameFromUrl(url) {
  const { hostname, pathname } = new URL(url);
  const safePath = pathname
    .replace(/\/$/, '')      // remove trailing slash
    .replace(/\W+/g, '_');   // replace non-word characters
  return `${hostname}${safePath ? '_' + safePath : ''}.png`;
}

// Main script
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

for (const url of urls) {
  try {
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });

    const filename = getFilenameFromUrl(url);
    const filepath = path.join(outputDir, filename);

    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`Saved screenshot: ${filepath}`);
  } catch (error) {
    console.error(`Failed to capture ${url}:`, error.message);
  }
}

await browser.close();
