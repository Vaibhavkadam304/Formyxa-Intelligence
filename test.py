import asyncio
import httpx
from playwright.async_api import async_playwright


async def get_session():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        await page.goto("https://www.sofascore.com", timeout=60000)
        await page.wait_for_timeout(5000)

        cookies = await context.cookies()
        ua = await page.evaluate("navigator.userAgent")

        await browser.close()
        return cookies, ua


def cookies_to_header(cookies):
    return "; ".join(f"{c['name']}={c['value']}" for c in cookies)


async def main():
    cookies, ua = await get_session()

    headers = {
        "User-Agent": ua,
        "Cookie": cookies_to_header(cookies),
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(headers=headers, timeout=10) as client:
        r = await client.get(
            "https://www.sofascore.com/api/v1/event/14566973"
        )
        print("Status:", r.status_code)
        print("Keys:", r.json().keys())


if __name__ == "__main__":
    asyncio.run(main())
