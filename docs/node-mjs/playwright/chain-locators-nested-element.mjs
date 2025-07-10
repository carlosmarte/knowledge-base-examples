import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com', { waitUntil: 'networkidle' });

  const roles = ['dialog', 'list', 'form', 'menu'];
  const leafRoles = ['button', 'link', 'checkbox', 'textbox', 'radio', 'switch', 'slider', 'tab'];

  /** Utility to escape quotes in JS strings */
  const esc = s => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`');

  const chains = [];

  for (const parentRole of roles) {
    const parentLocator = page.getByRole(parentRole);
    const parentCount = await parentLocator.count();
    for (let i = 0; i < parentCount; i++) {
      const parent = parentLocator.nth(i);
      const parentName = await parent.getAttribute('aria-label')
                        ?? await parent.getAttribute('aria-labelledby')
                        ?? await parent.textContent()
                        ?? '';
      const parentStr = `page.getByRole('${parentRole}'` + (parentName.trim() ? `, { name: \`${esc(parentName.trim())}\` }` : '') + `)`;

      for (const leafRole of leafRoles) {
        const leafLocator = parent.getByRole(leafRole);
        const leafCount = await leafLocator.count();
        for (let j = 0; j < leafCount; j++) {
          const leaf = leafLocator.nth(j);
          const leafName = await leaf.getAttribute('aria-label')
                            ?? await leaf.getAttribute('aria-labelledby')
                            ?? await leaf.textContent()
                            ?? '';
          let chain = `${parentStr}.getByRole('${leafRole}'`;
          if (leafName.trim()) chain += `, { name: \`${esc(leafName.trim())}\` }`;
          chain += ')';
          chains.push(chain);
        }
      }
    }
  }

  console.log(chains);
  await browser.close();
})();
