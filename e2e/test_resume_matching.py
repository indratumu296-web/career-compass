"""End-to-end test: upload two different resumes and assert that the
match percentages and the sorted job order are recomputed each time.

Run:  python3 e2e/test_resume_matching.py   (dev server must be on :8080)
"""

import asyncio
import re
import sys
import uuid
from pathlib import Path

from playwright.async_api import async_playwright

BASE_URL = "http://localhost:8080"
FIXTURES = Path(__file__).parent / "fixtures"
SCREENSHOTS = Path(__file__).parent / "screenshots"
RESUMES = [
    FIXTURES / "resume_data_engineer.txt",
    FIXTURES / "resume_frontend_designer.txt",
]
ANALYSIS_TIMEOUT_MS = 180_000


async def read_matches(page):
    """Return [(job title, score int)] in the order rendered on screen."""
    cards = page.locator("main article")
    await cards.first.wait_for(state="visible", timeout=ANALYSIS_TIMEOUT_MS)
    out = []
    for i in range(await cards.count()):
        card = cards.nth(i)
        title = (await card.locator("h2").first.inner_text()).strip()
        score_text = await card.locator("span.text-3xl").first.inner_text()
        out.append((title, int(re.sub(r"\D", "", score_text))))
    return out


async def analyze(page, resume: Path):
    # the real input is visually hidden, so go through the "Choose file" button
    async with page.expect_file_chooser() as chooser:
        await page.locator("button.primary-button").first.click()
    await (await chooser.value).set_files(str(resume))
    # wait for the analysis to finish (the spinner disappears)
    await page.wait_for_selector("main .animate-spin", timeout=15_000)
    await page.wait_for_function(
        "() => !document.querySelector('main .animate-spin')",
        timeout=ANALYSIS_TIMEOUT_MS,
    )

    matches = await read_matches(page)
    await page.screenshot(path=str(SCREENSHOTS / f"{resume.stem}.png"))
    return matches


async def main() -> int:
    SCREENSHOTS.mkdir(parents=True, exist_ok=True)
    failures = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        await page.goto(BASE_URL, wait_until="domcontentloaded")
        # unique device id => no cross-run cache reuse
        await page.evaluate(
            "id => localStorage.setItem('smarthire-device-id', id)", str(uuid.uuid4())
        )
        await page.reload(wait_until="domcontentloaded")

        results = []
        for resume in RESUMES:
            matches = await analyze(page, resume)
            print(f"\n{resume.name}:")
            for title, score in matches:
                print(f"  {score:>3}%  {title}")
            results.append(matches)

            if not matches:
                failures.append(f"{resume.name}: no job cards rendered")
            if len({s for _, s in matches}) <= 1:
                failures.append(f"{resume.name}: all scores identical (looks hardcoded)")
            scores = [s for _, s in matches]
            if scores != sorted(scores, reverse=True):
                failures.append(f"{resume.name}: jobs not sorted high -> low: {scores}")

        first, second = results
        if [s for _, s in first] == [s for _, s in second]:
            failures.append("match percentages did not change between the two resumes")
        if [t for t, _ in first] == [t for t, _ in second]:
            failures.append("job ranking order did not change between the two resumes")
        if errors:
            failures.append(f"console page errors: {errors}")

        await browser.close()

    print("\n" + ("FAILED\n- " + "\n- ".join(failures) if failures else "PASSED"))
    return 1 if failures else 0


sys.exit(asyncio.run(main()))
