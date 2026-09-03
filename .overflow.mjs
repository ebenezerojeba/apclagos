import { chromium } from "playwright";
const browser = await chromium.launch();
for (const width of [320, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3007/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const cw = document.documentElement.clientWidth;
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      if (getComputedStyle(el).position === "fixed") continue;
      if (b.right > cw + 0.5 || b.left < -0.5) {
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className?.toString?.() ?? "").slice(0, 95),
          l: Math.round(b.left), r: Math.round(b.right), w: Math.round(b.width),
        });
      }
    }
    return { cw, sw: document.documentElement.scrollWidth, out: out.slice(0, 12) };
  });
  console.log(`\n=== ${width}px  scrollW=${r.sw} clientW=${r.cw} ===`);
  for (const o of r.out) console.log(`  ${o.tag.padEnd(6)} L${String(o.l).padStart(5)} R${String(o.r).padStart(5)} W${String(o.w).padStart(4)}  ${o.cls}`);
  await ctx.close();
}
await browser.close();
