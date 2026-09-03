import { chromium } from "playwright";
const OUT = process.argv[2];
const browser = await chromium.launch();
for (const vp of [{n:"1440",w:1440,h:900},{n:"390",w:390,h:844}]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3007/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  for (let i = 0; i < 3; i++) {
    if (i > 0) {
      await page.locator('[role="tab"]').nth(i).click();
      await page.waitForTimeout(2200);
    }
    await page.mouse.move(vp.w - 5, vp.h - 5);
    await page.locator("section[aria-labelledby='hero-heading']")
      .screenshot({ path: `${OUT}/slide${i + 1}-${vp.n}.png` });
  }
  await ctx.close();
}
await browser.close();
console.log("captured");
