import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.argv[2] ?? ".";
const problems = [];
const note = (m) => problems.push(m);
const browser = await chromium.launch();

const VIEWPORTS = [
  { name: "320", width: 320, height: 700 },
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1920", width: 1920, height: 1080 },
];

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" && !/favicon|WebGL|GL Driver/i.test(t)) errs.push(`console: ${t}`);
  });
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);

  const r = await page.evaluate(() => {
    const doc = document.documentElement;
    const hero = document.querySelector("section[aria-labelledby='hero-heading']");
    const imgs = [...(hero?.querySelectorAll("img") ?? [])];
    return {
      overflow: doc.scrollWidth - doc.clientWidth,
      heroH: hero ? Math.round(hero.getBoundingClientRect().height) : 0,
      imgCount: imgs.length,
      imgsLoaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
      h1: document.querySelector("h1")?.textContent?.trim().slice(0, 60),
      tabs: hero?.querySelectorAll('[role="tab"]').length ?? 0,
      arrows: hero?.querySelectorAll('button[aria-label*="slide"]').length ?? 0,
      roleDesc: hero?.getAttribute("aria-roledescription"),
    };
  });

  if (r.overflow > 0) note(`${vp.name}: horizontal overflow +${r.overflow}px`);
  if (r.imgsLoaded !== r.imgCount) note(`${vp.name}: ${r.imgsLoaded}/${r.imgCount} hero images loaded`);
  if (r.tabs !== 3) note(`${vp.name}: expected 3 indicators, saw ${r.tabs}`);
  if (errs.length) note(`${vp.name}: ${errs.slice(0, 2).join(" | ")}`);

  console.log(`${String(vp.name).padStart(5)}  heroH=${String(r.heroH).padStart(4)}  imgs=${r.imgsLoaded}/${r.imgCount}  tabs=${r.tabs}  arrows=${r.arrows}  role=${r.roleDesc}  h1="${r.h1}"`);
  await page.screenshot({ path: `${OUT}/hero-${vp.name}.png` });
  await ctx.close();
}

/* -- Autoplay, controls, keyboard, swipe ---------------------------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => note(`interaction pageerror: ${e}`));
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  const headline = () => page.locator("h1").innerText();
  const activeTab = () =>
    page.locator('[role="tab"][aria-selected="true"]').getAttribute("aria-label");

  const first = await headline();
  console.log(`\nslide 1 headline: "${first.replace(/\s+/g, " ")}"`);
  console.log(`slide 1 tab: ${await activeTab()}`);

  // Next button
  await page.getByRole("button", { name: "Next slide" }).click();
  await page.waitForTimeout(1400);
  const second = await headline();
  if (second === first) note("Next button did not change the slide");
  console.log(`after Next:      "${second.replace(/\s+/g, " ")}"  tab=${await activeTab()}`);

  // Prev button
  await page.getByRole("button", { name: "Previous slide" }).click();
  await page.waitForTimeout(1400);
  const back = await headline();
  if (back !== first) note(`Previous button did not return to slide 1 (got "${back}")`);

  // Indicator jump
  await page.locator('[role="tab"]').nth(2).click();
  await page.waitForTimeout(1400);
  const third = await headline();
  console.log(`after tab 3:     "${third.replace(/\s+/g, " ")}"  tab=${await activeTab()}`);
  if (third === first) note("Indicator did not jump to slide 3");

  // Keyboard
  await page.getByRole("button", { name: "Next slide" }).focus();
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(1400);
  const afterKey = await headline();
  if (afterKey === third) note("ArrowLeft did not change the slide");
  console.log(`after ArrowLeft: "${afterKey.replace(/\s+/g, " ")}"`);

  // Autoplay: move the pointer away, then wait past one interval.
  await page.mouse.move(10, 10);
  await page.locator("footer").first().focus().catch(() => {});
  await page.mouse.click(5, 5).catch(() => {});
  await page.waitForTimeout(500);
  const beforeAuto = await headline();
  await page.waitForTimeout(9000);
  const afterAuto = await headline();
  if (afterAuto === beforeAuto) note("autoplay did not advance within 9s");
  console.log(`autoplay: "${beforeAuto.slice(0, 28)}" -> "${afterAuto.slice(0, 28)}"`);

  // Pause on hover
  await page.locator("section[aria-labelledby='hero-heading']").hover();
  await page.waitForTimeout(500);
  const hovered = await headline();
  await page.waitForTimeout(8500);
  if ((await headline()) !== hovered) note("autoplay did not pause while hovered");
  else console.log("autoplay pauses on hover: yes");

  await ctx.close();
}

/* -- Swipe (touch) --------------------------------------------------------- */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => note(`swipe pageerror: ${e}`));
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const before = await page.locator("h1").innerText();

  const box = await page.locator("section[aria-labelledby='hero-heading']").boundingBox();
  const y = box.y + box.height * 0.35;
  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, y, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(1500);

  const after = await page.locator("h1").innerText();
  if (after === before) note("swipe left did not advance the slide");
  else console.log(`swipe: "${before.slice(0, 26)}" -> "${after.slice(0, 26)}"`);
  await ctx.close();
}

/* -- Reduced motion -------------------------------------------------------- */
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const before = await page.locator("h1").innerText();
  await page.waitForTimeout(9000);
  const after = await page.locator("h1").innerText();
  if (before !== after) note("reduced motion: autoplay ran anyway");
  const canvases = await page.locator("canvas").count();
  if (canvases > 0) note(`reduced motion: ${canvases} canvas mounted`);
  console.log(`reduced motion: autoplay off=${before === after} canvases=${canvases}`);
  await ctx.close();
}

await browser.close();
console.log("\n================ HERO PROBLEMS ================");
console.log(problems.length ? problems.join("\n") : "none");
console.log(`Total: ${problems.length}`);
