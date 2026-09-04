import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 200)));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200)); });
page.on("requestfailed", (r) => errors.push(`reqfail: ${r.url().slice(0, 90)} :: ${r.failure()?.errorText}`));

await page.goto("http://localhost:3062/keystatic", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

const probe = await page.evaluate(() => {
  const main = document.querySelector("main#main");
  const body = document.body;
  const cs = (el) => el ? getComputedStyle(el) : null;
  const kids = main ? [...main.children].map((el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return { tag: el.tagName.toLowerCase(), cls: (el.className?.toString?.()||"").slice(0,60),
             h: Math.round(r.height), w: Math.round(r.width), pos: s.position, height: s.height };
  }) : [];
  return {
    mainHeight: main ? Math.round(main.getBoundingClientRect().height) : null,
    mainChildren: kids,
    mainTextLen: (main?.innerText || "").trim().length,
    bodyDisplay: cs(body)?.display,
    bodyMinHeight: cs(body)?.minHeight,
    htmlOverflowX: cs(document.documentElement)?.overflowX,
    footerPresent: Boolean(document.querySelector("footer")),
    headerPresent: Boolean(document.querySelector("header")),
    // Anything Keystatic-ish anywhere in the document?
    ksNodes: document.querySelectorAll('[class*="ks-"], [data-testid], [id^="ks"]').length,
    bodyTextSample: (document.body.innerText || "").replace(/\s+/g," ").slice(0, 260),
  };
});

console.log(JSON.stringify(probe, null, 2));
console.log("\n--- errors ---");
console.log(errors.length ? errors.slice(0, 8).join("\n") : "none");
await browser.close();
