import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const reqs = [];
page.on("response", async (r) => {
  const u = r.url();
  if (u.includes("github") || u.includes("/api/keystatic")) {
    reqs.push(`${r.status()} ${r.request().method()} ${u.slice(0, 120)}`);
  }
});
await page.goto("http://localhost:3062/keystatic", { waitUntil: "networkidle" });
await page.waitForTimeout(4000);

const info = await page.evaluate(() => {
  const root = document.querySelector("main#main > div");
  return {
    rootText: (root?.innerText || "").replace(/\s+/g, " ").trim(),
    rootHTMLSample: (root?.innerHTML || "").slice(0, 500),
    childCount: root ? root.children.length : 0,
    visibleButtons: [...document.querySelectorAll("main button, main a")]
      .map((el) => (el.textContent || "").trim())
      .filter(Boolean)
      .slice(0, 12),
  };
});
console.log("keystatic requests:");
console.log(reqs.length ? reqs.join("\n") : "  (none)");
console.log("\nrendered text:", JSON.stringify(info.rootText));
console.log("child count:", info.childCount);
console.log("controls:", JSON.stringify(info.visibleButtons));
console.log("\nHTML sample:\n", info.rootHTMLSample.slice(0, 400));
await browser.close();
