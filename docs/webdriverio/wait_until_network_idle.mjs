await browser.url('https://example.com');

// Wait until no more than 0 active network connections for at least 500ms
await browser.waitUntil(async () => {
  const inflight = await browser.execute(() => {
    const entries = performance.getEntriesByType('resource');
    const now = performance.now();
    const threshold = 500; // ms
    return entries.filter(e => now - e.responseEnd < threshold).length;
  });
  return inflight === 0;
}, {
  timeout: 10000,
  timeoutMsg: 'Page did not become idle in time',
});

// =====

await browser.setupInterceptor(); // From `wdio-intercept-service`

await browser.url('https://example.com');

// Wait until a known API call is done
await browser.waitUntil(async () => {
  const requests = await browser.getRequests();
  return requests.some(r => r.url.includes('/api/endpoint') && r.response.statusCode === 200);
}, {
  timeout: 10000,
  timeoutMsg: 'API call not complete',
});

// ====

// Wait for 'complete' page state
await browser.waitUntil(async () => {
  const state = await browser.execute(() => document.readyState);
  return state === 'complete';
}, {
  timeout: 10000,
  timeoutMsg: 'Page did not reach complete state'
});

// Additional small buffer (e.g., for AJAX content)
await browser.pause(500);
