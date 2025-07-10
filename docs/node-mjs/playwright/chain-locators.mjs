import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com', { waitUntil: 'networkidle' });

  const roles = ['dialog', 'list', 'form', 'menu'];
  const leafRoles = ['button', 'link', 'checkbox', 'textbox', 'radio', 'switch', 'slider', 'tab'];
  const esc = s => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`');

  // 1️⃣ Raw data builder
  async function buildLocatorObject(parent, parentRole, leaf, leafRole) {
    const [pname, lname] = await Promise.all([
      parent.getAttribute('aria-label')
        ?? parent.getAttribute('aria-labelledby')
        ?? parent.textContent() ?? '',
      leaf.getAttribute('aria-label')
        ?? leaf.getAttribute('aria-labelledby')
        ?? leaf.textContent() ?? ''
    ]);
    const { css, xpath } = await leaf.evaluate(el => {
      const derivePath = node => node.id
        ? `#${node.id}`
        : `${node.tagName.toLowerCase()}:nth-of-type(${
            Array.from(node.parentNode.children)
              .filter(c => c.tagName === node.tagName)
              .indexOf(node) + 1
          })`;
      const path = [];
      let n = el;
      while (n && n.nodeType === 1) { path.unshift(derivePath(n)); n = n.parentNode; }
      return { css: path.join(' > '), xpath: '//' + path.map(p => p.replace(/:nth-of-type\((\d+)\)/, '[position()=$1]')).join('/') };
    });
    return { parentRole, parentName: pname.trim(), leafRole, leafName: lname.trim(), css, xpath };
  }

  // 2️⃣ Generator utilities
  function generateChainLocator(o) {
    const p = `page.getByRole('${o.parentRole}'${o.parentName ? `, { name: \`${esc(o.parentName)}\` }` : ''})`;
    const l = `.getByRole('${o.leafRole}'${o.leafName ? `, { name: \`${esc(o.leafName)}\` }` : ''})`;
    return p + l;
  }
  function generateCSSLocator(o) { return `css=${o.css}`; }
  function generateXPathLocator(o) { return `xpath=${o.xpath}`; }

  // 🔍 — New: metadata chain
  function generateMetaDataChain(o) {
    const meta = [];
    meta.push(['page']);
    meta.push(['getByRole', o.parentRole, ...(o.parentName ? [{ name: o.parentName }] : [])]);
    meta.push(['getByRole', o.leafRole, ...(o.leafName ? [{ name: o.leafName }] : [])]);
    return { meta };
  }

  // 3️⃣ Main logic: build raw objects
  const raws = [];
  for (const parentRole of roles) {
    for (const parent of await page.getByRole(parentRole).all()) {
      for (const leafRole of leafRoles) {
        for (const leaf of await parent.getByRole(leafRole).all()) {
          raws.push(await buildLocatorObject(parent, parentRole, leaf, leafRole));
        }
      }
    }
  }
  await browser.close();

  // 4️⃣ Generate outputs
  const chains = raws.map(generateChainLocator);
  const csses = raws.map(generateCSSLocator);
  const xpaths = raws.map(generateXPathLocator);
  const metas = raws.map(generateMetaDataChain);

  console.log('Chain:', chains);
  console.log('CSS:', csses);
  console.log('XPath:', xpaths);
  console.log('Meta:', metas);
})();
