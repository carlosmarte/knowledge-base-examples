import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'https://example.com';
  
  // 1️⃣ Get server-rendered HTML (prior to JS execution)
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  const serverHTML = await response.text();
  console.log('--- Server-rendered HTML ---');
  console.log(serverHTML.slice(0, 500), '...');

  // 2️⃣ Let client JS run and get the final DOM
  await page.waitForLoadState('networkidle');
  const clientHTML = await page.content();
  console.log('--- Client-rendered HTML ---');
  console.log(clientHTML.slice(0, 500), '...');

  await browser.close();
})();
