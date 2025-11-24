import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com', { waitUntil: 'networkidle' });

  // List of ARIA roles considered interactive
  const roles = [
    'button', 'link', 'checkbox', 'textbox', 'radio',
    'combobox', 'menuitem', 'switch', 'tab', 'slider'
  ];

  for (const role of roles) {
    const locator = page.getByRole(role);
    const count = await locator.count();
    for (let i = 0; i < count; i++) {
      const el = locator.nth(i);
      // Capture accessible name
      const name = await el.getAttribute('aria-label')
                  ?? await el.getAttribute('aria-labelledby')
                  ?? await el.textContent()
                  ?? '';
      console.log(`<role=${role} name="${name.trim()}">`);
    }
  }

  await browser.close();
})();
