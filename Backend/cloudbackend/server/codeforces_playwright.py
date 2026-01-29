from playwright.async_api import async_playwright

async def fetch_codeforces_problem_async(contest_id, problem_index):
    url = f"https://codeforces.com/problemset/problem/{contest_id}/{problem_index}"

    async with async_playwright() as p:
        browser = await p.firefox.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, timeout=60000)

        title = await page.locator(
            ".problem-statement .header .title"
        ).first.inner_text()

        samples = []
        inputs = await page.locator(".input pre").all_inner_texts()
        outputs = await page.locator(".output pre").all_inner_texts()

        for i in range(len(inputs)):
            samples.append({
                "input": inputs[i].strip(),
                "output": outputs[i].strip(),
            })

        await browser.close()

        return {
            "title": title,
            "url": url,
            "samples": samples,
        }
