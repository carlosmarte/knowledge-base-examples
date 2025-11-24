const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();       // or launch({ headless: false })
  const page = await browser.newPage();
  await page.goto('https://example.com');        // Replace with your target URL

  // Run DOM script to collect all hrefs
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a'))
      .map(a => a.href)
      .filter(Boolean)
  );

  console.log('Collected links:', hrefs);
  await browser.close();
})();
