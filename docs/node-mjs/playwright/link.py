from playwright.sync_api import sync_playwright

def get_all_links(url):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(url)
        # Extract hrefs via DOM evaluation
        hrefs = page.evaluate("""() => 
            Array.from(document.querySelectorAll('a'))
                .map(a => a.href)
                .filter(Boolean)
        """)
        browser.close()
        return hrefs

if __name__ == "__main__":
    links = get_all_links("https://example.com")
    print("Collected links:", links)
