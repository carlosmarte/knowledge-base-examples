import { chromium } from 'playwright';  // or 'firefox', 'webkit'

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://example.com');          // Navigate to website
  // Optional: perform login or other steps here

  const cookies = await context.cookies();         // Fetch all cookies  [oai_citation:0‡Playwright](https://playwright.dev/docs/api/class-browsercontext?utm_source=chatgpt.com)
  console.log('Cookies:', cookies);

  await browser.close();
})();
