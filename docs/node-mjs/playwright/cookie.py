from playwright.async_api import async_playwright
import json

async with async_playwright() as pw:
    browser = await pw.chromium.launch()
    context = await browser.new_context()
    page = await context.new_page()

    await page.goto('https://example.com')
    cookies = await context.cookies()  # Fetch cookies  [oai_citation:3‡stably.ai](https://www.stably.ai/blog/mastering-cookie-management-in-playwright?utm_source=chatgpt.com)
    print("Cookies:", cookies)

    # Save cookies to file
    with open('cookies.json', 'w') as f:
        json.dump(cookies, f)

    # To reuse in a fresh context:
    new_context = await browser.new_context()
    with open('cookies.json', 'r') as f:
        saved = json.load(f)
    await new_context.add_cookies(saved)  # Reuse ()

    new_page = await new_context.new_page()
    await new_page.goto('https://example.com')
    # You're now using the saved session
    await browser.close()
