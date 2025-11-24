// test.js
const { Builder } = require('selenium-webdriver');

(async function runTest() {
  const username = process.env.SAUCE_USERNAME;
  const accessKey = process.env.SAUCE_ACCESS_KEY;

  const driver = await new Builder()
    .usingServer(`https://${username}:${accessKey}@ondemand.us-west-1.saucelabs.com/wd/hub`)
    .withCapabilities({
      browserName: 'chrome',
      platformName: 'Windows 11',
      browserVersion: 'latest',
      'sauce:options': {
        name: 'Simple Sauce Tunnel Test',
        tunnelIdentifier: 'my-tunnel-id', // 🔐 This must match the tunnel name
      },
    })
    .build();

  try {
    await driver.get('http://localhost:3000'); // 👈 This will route through the tunnel
    const title = await driver.getTitle();
    console.log('Page Title:', title);
  } finally {
    await driver.quit();
  }
})();
