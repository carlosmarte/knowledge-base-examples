import { remote } from 'webdriverio';

(async () => {
  const browser = await remote({
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    region: 'us-west-1',            // or 'eu'
    logLevel: 'info',
    capabilities: {
      browserName: 'chrome',
      'sauce:options': {
        build: 'My Build',
        name: 'Programmatic WDIO Test',
        // optionally: tunnelIdentifier: 'myTunnel'
      }
    }
  });

  await browser.url('https://webdriver.io');
  console.log(await browser.getTitle());
  await browser.deleteSession();
})();
