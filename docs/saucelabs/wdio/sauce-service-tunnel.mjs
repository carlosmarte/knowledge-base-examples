import { remote } from 'webdriverio';
import SauceService from '@wdio/sauce-service';

(async () => {
  const service = new SauceService({
    sauceConnect: true,
    sauceConnectOpts: { /* port, logfile, etc. */ }
  });
  await service.beforeSession({});
  
  const browser = await remote({
    ...service.wrapConfig({
      user: process.env.SAUCE_USERNAME,
      key: process.env.SAUCE_ACCESS_KEY,
      capabilities: {
        browserName: 'chrome',
        'sauce:options': { build: 'ProgWDIO', name: 'Prog WDIO Test' }
      }
    })
  });

  await browser.url('https://webdriver.io');
  console.log(await browser.getTitle());

  await browser.deleteSession();
  await service.after();
})();
