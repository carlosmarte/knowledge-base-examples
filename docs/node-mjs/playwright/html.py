from playwright.async_api import async_playwright

async with async_playwright() as p:
    browser = await p.chromium.launch()
    context = await browser.new_context()
    page = await context.new_page()

    resp = await page.goto("https://example.com", wait_until="domcontentloaded")
    server_html = await resp.text()
    print("Server HTML:", server_html[:500], "...")

    await page.wait_for_load_state("networkidle")
    client_html = await page.content()
    print("Client HTML:", client_html[:500], "...")

    await browser.close()
