import fs from 'fs';

const cookies = await context.cookies();
fs.writeFileSync('cookies.json', JSON.stringify(cookies));

// Later or in another script:
const saved = JSON.parse(fs.readFileSync('cookies.json'));
await context.addCookies(saved);  // Re-inject cookies  [oai_citation:1‡scrapingbee.com](https://www.scrapingbee.com/webscraping-questions/playwright/how-to-save-and-load-cookies-in-playwright/?utm_source=chatgpt.com) [oai_citation:2‡DEV Community](https://dev.to/scrapfly_dev/playwright-examples-for-web-scraping-and-automation-3hem?utm_source=chatgpt.com)
await page.goto('https://example.com');  // Now you'll be logged in automatically
